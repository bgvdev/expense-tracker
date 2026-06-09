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
                'slug'  => 'food-drinks',
                'icon'  => 'fastfood',
                'color' => '#FF5733',
            ],
            [
                'name'  => 'Transportation',
                'slug'  => 'transportation',
                'icon'  => 'directions_car',
                'color' => '#3357FF',
            ],
            [
                'name'  => 'Shopping',
                'slug'  => 'shopping',
                'icon'  => 'shopping_cart',
                'color' => '#F333FF',
            ],
            [
                'name'  => 'Housing/Rent',
                'slug'  => 'housing-rent',
                'icon'  => 'home',
                'color' => '#33FF57',
            ],
            [
                'name'  => 'Entertainment',
                'slug'  => 'entertainment',
                'icon'  => 'movie',
                'color' => '#FF33A1',
            ],
            [
                'name'  => 'Others',
                'slug'  => 'others',
                'icon'  => 'help_outline',
                'color' => '#808080',
            ],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
