#!/bin/sh
set -e

# Fix storage permissions (handles bind-mount ownership differences)
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Run migrations (with retry in case DB is starting up)
echo "Waiting for database..."
for i in $(seq 1 10); do
    if php artisan migrate --force; then
        # Only seed when explicitly enabled (safe default: off in production)
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
