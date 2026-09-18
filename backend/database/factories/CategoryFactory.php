<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            // Global by default; call ->forUser($user) for a user-scoped category.
            'user_id' => null,
            'name'    => Str::title($name),
            'icon'    => $this->faker->randomElement(['fastfood', 'home', 'movie', 'shopping_cart']),
            'color'   => $this->faker->hexColor(),
        ];
    }

    /**
     * A category owned by the given user.
     */
    public function forUser($user): static
    {
        return $this->state(fn () => [
            'user_id' => is_object($user) ? $user->id : $user,
        ]);
    }
}
