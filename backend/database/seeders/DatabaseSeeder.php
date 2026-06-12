<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            CategorySeeder::class,
            PaymentMethodSeeder::class,
        ]);

        // Only seed the test user in local/staging environments.
        // Set SEED_TEST_USER=true in .env to enable. Never enable in production.
        if (filter_var(env('SEED_TEST_USER', false), FILTER_VALIDATE_BOOLEAN)) {
            User::firstOrCreate(
                ['email' => 'test@example.com'],
                ['name' => 'Test User', 'password' => bcrypt('password')]
            );
        }
    }
}
