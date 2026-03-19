#!/bin/sh
set -e

cd /var/www/html

# In dev, vendor may not be baked in — install if missing
if [ ! -f vendor/autoload.php ]; then
    echo "Running composer install..."
    composer install --optimize-autoloader --no-interaction --no-progress
fi

# Generate app key if not set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

# Ensure sqlite db file exists (volume may be empty on first run)
touch database/database.sqlite

# Fix permissions
chown -R www-data:www-data storage bootstrap/cache database
chmod -R 775 storage bootstrap/cache database

# Run migrations
php artisan migrate --force

# Cache config/routes in production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
