# ── Stage 1: Node — build frontend assets (production only) ───────────────────
FROM node:20-alpine AS node-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# ── Stage 2: PHP base ──────────────────────────────────────────────────────────
FROM php:8.3-fpm-alpine AS php-base

RUN apk add --no-cache \
        linux-headers \
        nginx \
        curl \
        zip unzip \
        sqlite \
        sqlite-dev \
        supervisor \
    && docker-php-ext-install \
        pdo \
        pdo_sqlite \
        pcntl \
        bcmath \
        opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]


# ── Stage 3: dev ───────────────────────────────────────────────────────────────
# Source is mounted via docker-compose volume, not baked in.
# Vite serves assets via HMR (no pre-built public/build needed).
FROM php-base AS dev
# Composer install happens in the entrypoint on first run


# ── Stage 4: production ────────────────────────────────────────────────────────
FROM php-base AS production

COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache database \
    && touch database/database.sqlite \
    && chown -R www-data:www-data storage bootstrap/cache database \
    && chmod -R 775 storage bootstrap/cache database

# Pull in the pre-built Vite assets
COPY --from=node-build /app/public/build ./public/build
