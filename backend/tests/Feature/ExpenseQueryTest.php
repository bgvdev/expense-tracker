<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Server-side filtering, sorting and aggregation for GET /expenses and
 * GET /expenses/stats. The client no longer holds the full list, so these
 * endpoints are the only place the numbers are computed.
 */
class ExpenseQueryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function expense(array $attrs = []): Expense
    {
        return Expense::factory()->create(array_merge([
            'user_id'     => $this->user->id,
            'description' => null,
        ], $attrs));
    }

    /** @return list<int> */
    private function ids(string $query): array
    {
        return collect($this->actingAs($this->user)->getJson("/api/expenses?{$query}")->assertOk()->json('data'))
            ->pluck('id')->all();
    }

    public function test_date_range_is_inclusive_of_both_calendar_days(): void
    {
        $before = $this->expense(['spent_at' => '2026-08-31 00:00:00']);
        $first  = $this->expense(['spent_at' => '2026-09-01 00:00:00']);
        $last   = $this->expense(['spent_at' => '2026-09-30 23:59:59']);
        $after  = $this->expense(['spent_at' => '2026-10-01 00:00:00']);

        $ids = $this->ids('date_from=2026-09-01&date_to=2026-09-30');

        $this->assertEqualsCanonicalizing([$first->id, $last->id], $ids);
        $this->assertNotContains($before->id, $ids);
        $this->assertNotContains($after->id, $ids);
    }

    public function test_search_is_case_insensitive_and_treats_wildcards_literally(): void
    {
        $match   = $this->expense(['description' => 'Lunch at Cafe']);
        $percent = $this->expense(['description' => '50% off']);
        $this->expense(['description' => 'Dinner']);
        $this->expense(['description' => '500 rupees']);

        $this->assertSame([$match->id], $this->ids('search=lunch'));
        $this->assertSame([$percent->id], $this->ids('search='.urlencode('50%')));
    }

    public function test_category_payment_and_amount_filters_combine(): void
    {
        $food = Category::factory()->create();
        $fun  = Category::factory()->create();
        $upi  = PaymentMethod::create(['name' => 'UPI', 'slug' => 'upi-test']);
        $cash = PaymentMethod::create(['name' => 'Cash', 'slug' => 'cash-test']);

        $hit = $this->expense(['category_id' => $food->id, 'payment_method_id' => $upi->id, 'amount' => 100]);
        $this->expense(['category_id' => $food->id, 'payment_method_id' => $upi->id, 'amount' => 500]);  // over max
        $this->expense(['category_id' => $food->id, 'payment_method_id' => $cash->id, 'amount' => 100]); // wrong method
        $this->expense(['category_id' => $fun->id, 'payment_method_id' => $upi->id, 'amount' => 100]);   // wrong category

        $this->assertSame(
            [$hit->id],
            $this->ids("category_ids[]={$food->id}&payment_method_ids[]={$upi->id}&amount_min=50&amount_max=200"),
        );
    }

    public function test_meta_totals_cover_every_matching_row_not_just_the_page(): void
    {
        $this->expense(['amount' => 10, 'spent_at' => '2026-09-10']);
        $this->expense(['amount' => 20, 'spent_at' => '2026-09-11']);
        $this->expense(['amount' => 30, 'spent_at' => '2026-09-12']);
        $this->expense(['amount' => 99, 'spent_at' => '2026-08-01']);
        Expense::factory()->create(['amount' => 1000, 'spent_at' => '2026-09-10']); // another user

        $this->actingAs($this->user)
            ->getJson('/api/expenses?date_from=2026-09-01&date_to=2026-09-30&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.total_amount', 60)
            ->assertJsonPath('meta.user_total', 4);
    }

    public function test_every_column_sorts_both_ways(): void
    {
        $a    = Category::factory()->create(['name' => 'alpha']);
        $b    = Category::factory()->create(['name' => 'Beta']);
        $cash = PaymentMethod::create(['name' => 'Cash', 'slug' => 'cash-test']);
        $upi  = PaymentMethod::create(['name' => 'upi', 'slug' => 'upi-test']);

        $one   = $this->expense(['category_id' => $b->id, 'payment_method_id' => $upi->id,  'amount' => 30, 'description' => 'banana', 'spent_at' => '2026-09-01']);
        $two   = $this->expense(['category_id' => $a->id, 'payment_method_id' => $cash->id, 'amount' => 10, 'description' => 'Apple',  'spent_at' => '2026-09-03']);
        $three = $this->expense(['category_id' => $a->id, 'payment_method_id' => null,      'amount' => 20, 'description' => null,     'spent_at' => '2026-09-02']);

        $this->assertSame([$two->id, $three->id, $one->id], $this->ids('sort=date&dir=desc'));
        $this->assertSame([$one->id, $three->id, $two->id], $this->ids('sort=date&dir=asc'));
        $this->assertSame([$one->id, $three->id, $two->id], $this->ids('sort=amount&dir=desc'));
        // Case-insensitive; a blank description sorts as empty, so first ascending.
        $this->assertSame([$three->id, $two->id, $one->id], $this->ids('sort=description&dir=asc'));
        // Equal category names fall back to newest-first.
        $this->assertSame([$two->id, $three->id, $one->id], $this->ids('sort=category&dir=asc'));
        $this->assertSame([$one->id, $two->id, $three->id], $this->ids('sort=category&dir=desc'));
        // No payment method sorts as empty.
        $this->assertSame([$three->id, $two->id, $one->id], $this->ids('sort=payment&dir=asc'));
    }

    public function test_default_order_is_newest_first(): void
    {
        $old = $this->expense(['spent_at' => '2026-01-01']);
        $new = $this->expense(['spent_at' => '2026-09-01']);

        $this->assertSame([$new->id, $old->id], $this->ids(''));
    }

    public function test_malformed_filters_are_rejected_instead_of_ignored(): void
    {
        $this->actingAs($this->user);

        $this->getJson('/api/expenses?sort=drop_table')->assertStatus(422)->assertJsonValidationErrors('sort');
        $this->getJson('/api/expenses?dir=sideways')->assertStatus(422)->assertJsonValidationErrors('dir');
        $this->getJson('/api/expenses?date_from=01-09-2026')->assertStatus(422)->assertJsonValidationErrors('date_from');
        $this->getJson('/api/expenses?date_from=2026-09-30&date_to=2026-09-01')->assertStatus(422)->assertJsonValidationErrors('date_to');
        $this->getJson('/api/expenses?amount_min=50&amount_max=10')->assertStatus(422)->assertJsonValidationErrors('amount_max');
        $this->getJson('/api/expenses/stats?sort=nope')->assertStatus(422);
    }

    public function test_either_bound_of_a_range_may_be_sent_alone(): void
    {
        $cheap = $this->expense(['amount' => 10, 'spent_at' => '2026-09-01']);
        $dear  = $this->expense(['amount' => 500, 'spent_at' => '2026-09-20']);

        $this->assertSame([$cheap->id], $this->ids('amount_max=100'));
        $this->assertSame([$dear->id], $this->ids('amount_min=100'));
        $this->assertSame([$cheap->id], $this->ids('date_to=2026-09-10'));
        $this->assertSame([$dear->id], $this->ids('date_from=2026-09-10'));
    }

    public function test_stats_aggregates_only_the_users_filtered_expenses(): void
    {
        $food = Category::factory()->create(['name' => 'Food']);
        $fun  = Category::factory()->create(['name' => 'Fun']);
        $upi  = PaymentMethod::create(['name' => 'UPI', 'slug' => 'upi-test']);

        $this->expense(['category_id' => $food->id, 'payment_method_id' => $upi->id, 'amount' => 10, 'spent_at' => '2026-09-01']);
        $this->expense(['category_id' => $food->id, 'payment_method_id' => $upi->id, 'amount' => 15, 'spent_at' => '2026-09-01']);
        $this->expense(['category_id' => $food->id, 'payment_method_id' => null,     'amount' => 5,  'spent_at' => '2026-09-20']);
        $big = $this->expense(['category_id' => $fun->id, 'payment_method_id' => $upi->id, 'amount' => 70, 'spent_at' => '2026-10-02']);
        $this->expense(['category_id' => $fun->id, 'amount' => 500, 'spent_at' => '2025-01-01']); // outside the range
        Expense::factory()->create(['category_id' => $fun->id, 'amount' => 9999, 'spent_at' => '2026-09-05']); // another user

        $this->actingAs($this->user)
            ->getJson('/api/expenses/stats?date_from=2026-09-01&date_to=2026-10-31')
            ->assertOk()
            ->assertJsonPath('count', 4)
            ->assertJsonPath('total', 100)
            ->assertJsonPath('first_date', '2026-09-01')
            ->assertJsonPath('last_date', '2026-10-02')
            ->assertJsonPath('highest.id', $big->id)
            // Most-used is by count, not spend: Food has 3 rows, Fun 1.
            ->assertJsonPath('most_used_category.category.name', 'Food')
            ->assertJsonPath('most_used_category.count', 3)
            ->assertJsonPath('by_category', [
                ['category' => ['id' => $fun->id, 'name' => 'Fun', 'icon' => $fun->icon, 'color' => $fun->color], 'count' => 1, 'total' => 70],
                ['category' => ['id' => $food->id, 'name' => 'Food', 'icon' => $food->icon, 'color' => $food->color], 'count' => 3, 'total' => 30],
            ])
            // Unspecified method last, whatever its total.
            ->assertJsonPath('by_payment_method', [
                ['id' => $upi->id, 'name' => 'UPI', 'total' => 95],
                ['id' => null, 'name' => null, 'total' => 5],
            ])
            ->assertJsonPath('daily', [
                ['date' => '2026-09-01', 'total' => 25],
                ['date' => '2026-09-20', 'total' => 5],
                ['date' => '2026-10-02', 'total' => 70],
            ])
            ->assertJsonPath('monthly', [
                ['month' => '2026-09', 'total' => 30],
                ['month' => '2026-10', 'total' => 70],
            ]);
    }

    public function test_stats_for_no_matching_rows_is_empty_not_an_error(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/expenses/stats')
            ->assertOk()
            ->assertJsonPath('count', 0)
            ->assertJsonPath('total', 0)
            ->assertJsonPath('highest', null)
            ->assertJsonPath('most_used_category', null)
            ->assertJsonPath('by_category', [])
            ->assertJsonPath('daily', []);
    }

    public function test_stats_requires_authentication(): void
    {
        $this->getJson('/api/expenses/stats')->assertUnauthorized();
    }
}
