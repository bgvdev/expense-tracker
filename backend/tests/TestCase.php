<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Abort rather than let RefreshDatabase touch a non-test database.
     *
     * RefreshDatabase drops every table it finds, and the suite points at a real
     * Postgres server, so pointing at the wrong database destroys real data —
     * which is exactly what happened once. This hook runs after the application
     * boots but BEFORE the test traits are set up, which is where RefreshDatabase
     * migrates, so a wrong connection is caught while it is still harmless.
     *
     * See tests/bootstrap.php for how the connection is pinned.
     */
    protected function setUpTraits()
    {
        $connection = config('database.default');
        $database   = config("database.connections.{$connection}.database");

        if (! str_ends_with((string) $database, '_test')) {
            $this->fail(
                "Refusing to run tests against database '{$database}': the name must end in '_test'. ".
                'RefreshDatabase would drop every table in it. See tests/bootstrap.php.'
            );
        }

        return parent::setUpTraits();
    }
}
