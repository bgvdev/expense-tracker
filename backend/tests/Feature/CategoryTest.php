<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_global_and_own_categories_with_is_global_flag(): void
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();

        $global = Category::factory()->create(['name' => 'Global Cat']);
        $own    = Category::factory()->forUser($user)->create(['name' => 'My Cat']);
        Category::factory()->forUser($other)->create(['name' => 'Not Mine']);

        $response = $this->actingAs($user)->getJson('/api/categories')->assertOk();

        $ids = collect($response->json())->pluck('id');
        $this->assertTrue($ids->contains($global->id));
        $this->assertTrue($ids->contains($own->id));
        $this->assertCount(2, $response->json());

        $globalRow = collect($response->json())->firstWhere('id', $global->id);
        $ownRow    = collect($response->json())->firstWhere('id', $own->id);
        $this->assertTrue($globalRow['is_global']);
        $this->assertFalse($ownRow['is_global']);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/categories')->assertUnauthorized();
    }

    /**
     * Regression guard for the bug that prompted this work: POST /api/categories
     * must create a category scoped to the authenticated user.
     */
    public function test_store_creates_user_scoped_category(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name'  => 'Travel',
            'icon'  => 'flight',
            'color' => '#1A2B3C',
        ]);

        $response->assertCreated()
            ->assertJson(['name' => 'Travel', 'is_global' => false]);

        $this->assertDatabaseHas('category', [
            'name'    => 'Travel',
            'user_id' => $user->id,
            'slug'    => 'travel',
        ]);
    }

    public function test_store_generates_unique_slug_per_user(): void
    {
        $user = User::factory()->create();
        Category::factory()->forUser($user)->create(['name' => 'Travel', 'slug' => 'travel']);

        $this->actingAs($user)->postJson('/api/categories', [
            'name'  => 'Travel',
            'icon'  => 'flight',
            'color' => '#1A2B3C',
        ])->assertCreated()->assertJsonPath('slug', 'travel-1');
    }

    public function test_store_validates_color_format(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/categories', [
            'name'  => 'Bad',
            'icon'  => 'flight',
            'color' => 'not-a-hex',
        ])->assertStatus(422)->assertJsonValidationErrors('color');
    }

    public function test_update_only_affects_own_category(): void
    {
        $user   = User::factory()->create();
        $other  = User::factory()->create();
        $theirs = Category::factory()->forUser($other)->create();

        $this->actingAs($user)->patchJson("/api/categories/{$theirs->id}", [
            'name' => 'Hacked',
        ])->assertNotFound();
    }

    public function test_destroy_removes_own_category(): void
    {
        $user     = User::factory()->create();
        $category = Category::factory()->forUser($user)->create();

        $this->actingAs($user)
            ->deleteJson("/api/categories/{$category->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('category', ['id' => $category->id]);
    }

    public function test_destroy_blocked_when_category_in_use(): void
    {
        $user     = User::factory()->create();
        $category = Category::factory()->forUser($user)->create();
        Expense::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);

        $this->actingAs($user)
            ->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('category', ['id' => $category->id]);
    }
}
