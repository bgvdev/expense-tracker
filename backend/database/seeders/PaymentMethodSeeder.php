<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Cash',        'slug' => 'cash'],
            ['name' => 'Credit Card', 'slug' => 'credit-card'],
            ['name' => 'Debit Card',  'slug' => 'debit-card'],
            ['name' => 'UPI',         'slug' => 'upi'],
            ['name' => 'Net Banking', 'slug' => 'net-banking'],
            ['name' => 'Other',       'slug' => 'other'],
        ];

        foreach ($methods as $method) {
            PaymentMethod::firstOrCreate(['slug' => $method['slug']], $method);
        }
    }
}
