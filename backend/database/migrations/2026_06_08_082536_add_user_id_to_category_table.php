<?php

use Illuminate\Database\Migrations\Migration;

/*
 * Reverted to a no-op.
 *
 * The original version added category.user_id with the MySQL-only ->after('id')
 * modifier (silently dropped on PostgreSQL) and was not idempotent, so on
 * production it could be recorded as "run" without the column actually being
 * present — and because it's already in the migrations table, editing its body
 * would never re-execute it.
 *
 * The column is now added safely and idempotently by
 * 2026_06_09_120000_re_add_user_id_to_category_table.php. This file is left as a
 * no-op to preserve migration history (and to stay harmless on fresh installs).
 */
return new class extends Migration
{
    public function up(): void
    {
        //
    }

    public function down(): void
    {
        //
    }
};
