#!/bin/sh
set -e

# Fix storage permissions (handles bind-mount ownership differences)
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Run migrations + seed (with retry in case DB is still starting up).
# --isolated takes an advisory lock so concurrent instances don't race the migrator.
echo "Waiting for database..."
for i in $(seq 1 10); do
    if php artisan migrate --force --isolated; then
        # Reference data: the default categories must exist in every environment.
        # CategorySeeder is idempotent (firstOrCreate on slug), so this is safe to
        # re-run on every deploy.
        php artisan db:seed --class=CategorySeeder --force

        # Test fixtures (test@example.com): local/staging only, never production.
        if [ "${SEED_TEST_USER:-false}" = "true" ]; then
            php artisan db:seed --force
        fi
        break
    fi
    sleep 3
done

# Start PHP-FPM in background
php-fpm -D

# Start Nginx in foreground
nginx -g "daemon off;"
