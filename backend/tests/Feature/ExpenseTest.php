<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_only_own_expenses_wrapped_in_data(): void
    {
        $user     = User::factory()->create();
        $other    = User::factory()->create();
        $category = Category::factory()->create();

        Expense::factory()->count(2)->create(['user_id' => $user->id, 'category_id' => $category->id]);
        Expense::factory()->create(['user_id' => $other->id, 'category_id' => $category->id]);

        $this->actingAs($user)->getJson('/api/expenses')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data' => [['id', 'amount', 'description', 'spent_at', 'category' => ['id', 'name', 'icon', 'color']]]]);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/expenses')->assertUnauthorized();
    }

    public function test_store_creates_expense_for_authenticated_user(): void
    {
        $user     = User::factory()->create();
        $category = Category::factory()->create();

        $this->actingAs($user)->postJson('/api/expenses', [
            'amount'      => 42.50,
            'category_id' => $category->id,
            'description' => 'Lunch',
            'spent_at'    => '2026-06-01T12:00:00Z',
        ])->assertCreated()->assertJsonPath('data.description', 'Lunch');

        $this->assertDatabaseHas('expense', [
            'user_id'     => $user->id,
            'category_id' => $category->id,
            'description' => 'Lunch',
        ]);
    }

    public function test_store_rejects_inaccessible_category(): void
    {
        $user          = User::factory()->create();
        $other         = User::factory()->create();
        $theirCategory = Category::factory()->forUser($other)->create();

        $this->actingAs($user)->postJson('/api/expenses', [
            'amount'      => 10,
            'category_id' => $theirCategory->id,
            'spent_at'    => '2026-06-01T12:00:00Z',
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_update_only_affects_own_expense(): void
    {
        $user   = User::factory()->create();
        $other  = User::factory()->create();
        $theirs = Expense::factory()->create(['user_id' => $other->id]);

        $this->actingAs($user)->patchJson("/api/expenses/{$theirs->id}", [
            'amount' => 999,
        ])->assertNotFound();
    }

    public function test_destroy_removes_own_expense(): void
    {
        $user    = User::factory()->create();
        $expense = Expense::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->deleteJson("/api/expenses/{$expense->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('expense', ['id' => $expense->id]);
    }
}
