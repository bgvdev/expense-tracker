<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Tracks incorrect OTP submissions per account so a reset token can be discarded
 * after a handful of wrong guesses. Previously the only protection was the shared
 * per-IP throttle on the auth route group, which login competes for and which
 * does nothing against a distributed guessing attempt on a single 6-digit OTP.
 *
 * Idempotent, and PostgreSQL-safe (no MySQL-only ->after() hint).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('password_reset_tokens', 'attempts')) {
            return;
        }

        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->unsignedTinyInteger('attempts')->default(0);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('password_reset_tokens', 'attempts')) {
            return;
        }

        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->dropColumn('attempts');
        });
    }
};
