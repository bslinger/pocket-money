<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Polyfill for request_parse_body() added in PHP 8.4 (Symfony 8.x requires it for PUT/PATCH/DELETE).
if (!function_exists('request_parse_body')) {
    function request_parse_body(?array $options = null): array {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_starts_with($contentType, 'application/x-www-form-urlencoded')) {
            parse_str(file_get_contents('php://input'), $post);
            return [$post, []];
        }
        if (str_starts_with($contentType, 'multipart/form-data')) {
            return [$_POST, $_FILES];
        }
        return [[], []];
    }
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
