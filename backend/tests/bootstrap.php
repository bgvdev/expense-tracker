<?php

/*
 * Pin the test connection BEFORE the framework boots.
 *
 * The suite runs against Postgres — the same engine as production — so that
 * engine-specific behaviour is actually exercised: constraint-backed unique
 * indexes, FKs that do not create their own index, non-sargable whereYear().
 * A SQLite suite silently passes over all of it.
 *
 * It must be a SEPARATE database, because RefreshDatabase drops every table on
 * every run. It once ran against the dev database and emptied it: PHPUnit's
 * <env force="true"> sets getenv() and $_ENV but NOT $_SERVER, and Laravel
 * resolves env() through Dotenv, which reads $_SERVER first — so the DB_* vars
 * docker-compose.yml exports into the api container won. Writing all three here
 * is the only layer that holds. Tests\TestCase then refuses to run at all
 * unless the database name ends in `_test`.
 *
 * Host, port and credentials are left as the environment supplies them, so this
 * works both inside the api container and standalone. Only the database NAME is
 * forced, derived from DB_DATABASE so a renamed dev database stays in step.
 */
$database = getenv('DB_DATABASE') ?: 'expense_tracker';

if (! str_ends_with($database, '_test')) {
    $database .= '_test';
}

foreach ([
    'DB_CONNECTION' => 'pgsql',
    'DB_DATABASE'   => $database,
    // A DB_URL would override the discrete DB_* values above.
    'DB_URL' => '',
] as $key => $value) {
    $_SERVER[$key] = $_ENV[$key] = $value;
    putenv("{$key}={$value}");
}

require __DIR__.'/../vendor/autoload.php';
