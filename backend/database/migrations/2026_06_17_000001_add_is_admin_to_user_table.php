<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Idempotent and PostgreSQL-safe, matching the pattern established by
 * re_add_user_id_to_category_table. The original version of this migration used
 * ->after('email') — a MySQL-only hint Postgres silently ignores — and had no
 * hasColumn() guard: the same combination that previously left a column missing
 * in production while appearing fine locally.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('user', 'is_admin')) {
            return;
        }

        Schema::table('user', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('user', 'is_admin')) {
            return;
        }

        Schema::table('user', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
