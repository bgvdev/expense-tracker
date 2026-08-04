FROM php:8.3-fpm

# Install system dependencies + Nginx
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    nginx \
    && docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer directly (no multi-stage, avoids IPv6 registry issue)
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# Copy composer files first for layer caching
COPY composer.json composer.lock ./

# Install PHP dependencies (no dev)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy full application
COPY . .

# Post-install scripts
RUN composer run-script post-autoload-dump 2>/dev/null || true

# Permissions. storage/ and bootstrap/cache must stay group-writable: the
# entrypoint writes the config/route caches there at runtime as www-data.
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Nginx config
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Run unprivileged. nginx listens on 8000 (>1024), so no root is needed to bind;
# it does need writable pid/log/temp paths, and php-fpm's pool must not try to
# setuid (only permitted when the master runs as root).
RUN mkdir -p /var/lib/nginx/body /var/log/nginx /run \
    && chown -R www-data:www-data /var/lib/nginx /var/log/nginx \
    && touch /run/nginx.pid && chown www-data:www-data /run/nginx.pid \
    && sed -i 's/^user www-data;/# user directive removed: master runs unprivileged/' /etc/nginx/nginx.conf \
    && sed -i 's/^pid .*/pid \/run\/nginx.pid;/' /etc/nginx/nginx.conf \
    && sed -i 's/^user = www-data/; user directive removed: master runs unprivileged/' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's/^group = www-data/; group directive removed: master runs unprivileged/' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|^;\?error_log = .*|error_log = /proc/self/fd/2|' /usr/local/etc/php-fpm.conf

EXPOSE 8000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# www-data has no home directory by default; without a writable one, tooling that
# expects to write there (php artisan tinker's psysh config) fails.
RUN mkdir -p /var/www/.config && chown -R www-data:www-data /var/www/.config
ENV HOME=/var/www

USER www-data

ENTRYPOINT ["docker-entrypoint.sh"]
