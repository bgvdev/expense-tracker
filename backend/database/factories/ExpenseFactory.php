<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'category_id' => Category::factory(),
            'amount'      => $this->faker->randomFloat(2, 1, 1000),
            'description' => $this->faker->optional()->sentence(3),
            'spent_at'    => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
