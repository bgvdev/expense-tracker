-- The test suite runs against a SEPARATE database on the same engine as
-- production, so Postgres-specific behaviour (constraint-backed unique
-- indexes, unindexed FKs, non-sargable date filters) is actually exercised.
--
-- It must never be the dev database: RefreshDatabase drops every table on each
-- run. Tests\TestCase refuses to start unless the connection name ends in
-- `_test`, and tests/bootstrap.php pins it there.
--
-- Scripts in /docker-entrypoint-initdb.d only run when the data volume is
-- first created. For an existing volume, create it by hand:
--   docker compose exec db psql -U laravel -d expense_tracker \
--     -c 'CREATE DATABASE expense_tracker_test OWNER laravel'
SELECT 'CREATE DATABASE expense_tracker_test OWNER laravel'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'expense_tracker_test')\gexec
