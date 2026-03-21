<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Collects Xdebug code coverage per request when COLLECT_COVERAGE=true.
 * Raw coverage data is written to storage/coverage/raw/ as serialized PHP files.
 * Run `php artisan coverage:generate` after tests to produce an HTML report.
 */
class CollectCoverage
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!config('coverage.enabled') || !extension_loaded('xdebug')) {
            return $next($request);
        }

        xdebug_start_code_coverage(XDEBUG_CC_UNUSED | XDEBUG_CC_DEAD_CODE);

        $response = $next($request);

        $data = xdebug_get_code_coverage();
        xdebug_stop_code_coverage(false);

        $dir = storage_path('coverage/raw');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(
            $dir . '/' . uniqid('cov_', true) . '.php',
            serialize($data)
        );

        return $response;
    }
}
