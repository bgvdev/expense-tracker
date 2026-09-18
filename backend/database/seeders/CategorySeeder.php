<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name'  => 'Food & Drinks',
                'icon'  => 'fastfood',
                'color' => '#FF5733',
            ],
            [
                'name'  => 'Transportation',
                'icon'  => 'directions_car',
                'color' => '#3357FF',
            ],
            [
                'name'  => 'Shopping',
                'icon'  => 'shopping_cart',
                'color' => '#F333FF',
            ],
            [
                'name'  => 'Housing/Rent',
                'icon'  => 'home',
                'color' => '#33FF57',
            ],
            [
                'name'  => 'Entertainment',
                'icon'  => 'movie',
                'color' => '#FF33A1',
            ],
            [
                'name'  => 'Others',
                'icon'  => 'help_outline',
                'color' => '#808080',
            ],
        ];

        foreach ($categories as $category) {
            // The six defaults are global (user_id = null); name identifies them.
            Category::firstOrCreate(['name' => $category['name'], 'user_id' => null], $category);
        }
    }
}
