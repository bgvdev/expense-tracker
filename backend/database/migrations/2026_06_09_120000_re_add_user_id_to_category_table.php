<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Idempotent, PostgreSQL-safe replacement for the original
 * add_user_id_to_category_table migration. Adds the nullable user_id FK only
 * when it's missing, so it:
 *   - adds the column on production (where the original never took effect), and
 *   - skips cleanly on environments that already have it (local/staging).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('category', 'user_id')) {
            return;
        }

        Schema::table('category', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('user')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('category', 'user_id')) {
            return;
        }

        Schema::table('category', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
