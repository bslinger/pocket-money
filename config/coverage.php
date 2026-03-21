<?php

return [
    /*
     * Set COLLECT_COVERAGE=true in the environment to enable per-request
     * Xdebug coverage collection during E2E test runs.
     * Also requires XDEBUG_MODE=coverage to be set in the server process.
     */
    'enabled' => env('COLLECT_COVERAGE', false),
];
