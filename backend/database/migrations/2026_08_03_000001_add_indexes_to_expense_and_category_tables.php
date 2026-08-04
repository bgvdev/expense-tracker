<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * On PostgreSQL a foreign-key constraint does NOT create an index on the
 * referencing column (unlike MySQL/InnoDB), so every FK declared with
 * foreignId()->constrained() in this schema was unindexed. Production runs on
 * Neon Postgres, so these were full sequential scans.
 *
 * The composite (user_id, spent_at) covers the hot path in
 * ExpenseController::index — the user's expenses ordered by spent_at desc — and
 * also serves ExpenseController::summary. Idempotent so it is safe to re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense', function (Blueprint $table) {
            $table->index(['user_id', 'spent_at'], 'expense_user_id_spent_at_index');
            $table->index('category_id', 'expense_category_id_index');
            $table->index('payment_method_id', 'expense_payment_method_id_index');
        });

        Schema::table('category', function (Blueprint $table) {
            $table->index('user_id', 'category_user_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('expense', function (Blueprint $table) {
            $table->dropIndex('expense_user_id_spent_at_index');
            $table->dropIndex('expense_category_id_index');
            $table->dropIndex('expense_payment_method_id_index');
        });

        Schema::table('category', function (Blueprint $table) {
            $table->dropIndex('category_user_id_index');
        });
    }
};
