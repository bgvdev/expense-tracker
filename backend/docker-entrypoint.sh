#!/bin/sh
set -e

# Fix storage permissions where possible. Both are no-ops when running as
# www-data (the normal case), which cannot chown paths it does not own.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Verify writability up front. Without this check, an unwritable directory
# surfaces as a Monolog "could not be opened in append mode" stack trace on every
# migration attempt, which buries the actual cause.
for dir in /var/www/html/storage/logs /var/www/html/storage/framework /var/www/html/bootstrap/cache; do
    mkdir -p "$dir" 2>/dev/null || true
    if ! [ -w "$dir" ]; then
        echo "FATAL: $dir is not writable by $(id -un)." >&2
        echo "  Under Docker Compose, storage/ and bootstrap/cache must be mounted as" >&2
        echo "  named volumes rather than through the ./backend bind mount — the" >&2
        echo "  container runs unprivileged and cannot chown host-owned paths." >&2
        exit 1
    fi
done

# APP_KEY must be provided by the environment. Generating one here would write a
# NEW key on every boot: on a container with an ephemeral filesystem that
# silently invalidates every encrypted payload and signed URL after each restart,
# which is far worse than refusing to start.
if [ -z "$APP_KEY" ]; then
    if [ "${APP_ENV:-production}" = "local" ]; then
        echo "APP_KEY is empty; generating an ephemeral key for local development." >&2
        php artisan key:generate --force
    else
        echo "FATAL: APP_KEY is not set. Set it in the environment (php artisan key:generate --show)." >&2
        exit 1
    fi
fi

# Neon's pooler (PgBouncer in transaction mode) is incompatible with Laravel's
# session-level advisory locks used during migrations. DB_MIGRATE_URL should be
# set to the direct (non-pooled) Neon connection string in the Render dashboard.
# The app continues using DATABASE_URL (pooler) for all normal request traffic.
MIGRATE_DB_URL="${DB_MIGRATE_URL:-${DATABASE_URL}}"

# Run migrations + seed (with retry in case DB is still starting up).
echo "Waiting for database..."
migrated=0
for i in $(seq 1 10); do
    if DATABASE_URL="${MIGRATE_DB_URL}" php artisan migrate --force; then
        # Reference data: the default categories must exist in every environment.
        # CategorySeeder is idempotent (firstOrCreate on name + null user_id), so
        # this is safe to re-run on every deploy.
        php artisan db:seed --class=CategorySeeder --force
        php artisan db:seed --class=PaymentMethodSeeder --force

        # Test fixtures (test@example.com): local/staging only, never production.
        if [ "${SEED_TEST_USER:-false}" = "true" ]; then
            php artisan db:seed --force
        fi
        migrated=1
        break
    fi
    echo "Migration attempt ${i}/10 failed; retrying in 3s..."
    sleep 3
done

# Fail the boot loudly rather than serving traffic against an un-migrated schema.
# Previously this loop fell through silently: PHP-FPM and Nginx started anyway,
# /api/health returned 200, and Render's health gate routed traffic to a deploy
# whose migrations had never run.
if [ "$migrated" -ne 1 ]; then
    echo "FATAL: migrations did not succeed after 10 attempts — refusing to start." >&2
    exit 1
fi

# Cache config and routes so they are not re-parsed and re-registered on every
# request. This must happen HERE and not in the Dockerfile: caching at build time
# would freeze the build environment's (empty) env values into the cache, since
# env() is only read when the cache is written.
#
# Skipped in local dev, where the bind-mounted source changes constantly and a
# stale cache is more confusing than the small performance cost.
if [ "${APP_ENV:-production}" != "local" ]; then
    php artisan config:cache
    php artisan route:cache
else
    php artisan config:clear
    php artisan route:clear
fi

# Start PHP-FPM in background
php-fpm -D

# Start Nginx in foreground
nginx -g "daemon off;"
