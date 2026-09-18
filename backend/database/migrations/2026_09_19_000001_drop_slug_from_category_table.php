<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * category.slug carried a GLOBAL unique index, which made it the only reason
 * Category::uniqueSlug() had to dedupe new names against every row in the
 * table — including rows belonging to other users. Nothing ever read the
 * value: the API keys categories by id, the frontend never referenced it, and
 * CategorySeeder only used it as its firstOrCreate() key (now name + global
 * user_id, which identifies the six defaults just as well).
 *
 * Tenancy is expressed entirely by category.user_id — null for the shared
 * defaults, the owner's id otherwise — so dropping the column also lifts the
 * accidental restriction that two different users could not both name a
 * category "Travel".
 *
 * The index is dropped explicitly first, and by lookup rather than by assumed
 * name: SQLite (the test connection) refuses to drop a column that an index
 * still references, and renaming a table on Postgres does not rename its
 * indexes, so after the categories→category rename the name on any given
 * database is not something this migration can hard-code. A unique index is
 * dropped with dropUnique(), because on Postgres it is backed by a constraint
 * and a bare DROP INDEX is refused; on SQLite both compile to DROP INDEX.
 *
 * Idempotent so it is safe to re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('category', 'slug')) {
            return;
        }

        foreach (Schema::getIndexes('category') as $index) {
            if ($index['columns'] === ['slug']) {
                Schema::table('category', function (Blueprint $table) use ($index) {
                    $index['unique']
                        ? $table->dropUnique($index['name'])
                        : $table->dropIndex($index['name']);
                });
            }
        }

        Schema::table('category', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }

    /**
     * The original values cannot be recovered, so the column comes back
     * nullable. Postgres permits any number of NULLs under a unique index.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('category', 'slug')) {
            Schema::table('category', function (Blueprint $table) {
                $table->string('slug')->nullable()->unique();
            });
        }
    }
};
