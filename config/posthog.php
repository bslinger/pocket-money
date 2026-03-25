<?php

return [
    'api_key' => env('POSTHOG_API_KEY', ''),
    'host' => env('POSTHOG_HOST', 'https://eu.i.posthog.com'),
    'enabled' => env('POSTHOG_ENABLED', true),
];
