<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if old plural table exists before renaming to support both fresh installs and existing production DBs
        if (Schema::hasTable('users') && ! Schema::hasTable('user')) {
            Schema::rename('users', 'user');
        }

        if (Schema::hasTable('categories') && ! Schema::hasTable('category')) {
            Schema::rename('categories', 'category');
        }

        if (Schema::hasTable('expenses') && ! Schema::hasTable('expense')) {
            Schema::rename('expenses', 'expense');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('user') && ! Schema::hasTable('users')) {
            Schema::rename('user', 'users');
        }

        if (Schema::hasTable('category') && ! Schema::hasTable('categories')) {
            Schema::rename('category', 'categories');
        }

        if (Schema::hasTable('expense') && ! Schema::hasTable('expenses')) {
            Schema::rename('expense', 'expenses');
        }
    }
};
