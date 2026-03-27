<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastCatchupAt
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Runs after the response is sent to the client.
     * Updates last_catchup_at so the next session only shows new events.
     * Debounced to once per minute to reduce DB writes.
     */
    public function terminate(Request $request, Response $response): void
    {
        $user = $request->user();

        if ($user === null) {
            return;
        }

        // Skip the catch-up check endpoint itself so it reads the pre-session value
        if ($request->routeIs('catchup.check') || $request->routeIs('api.v1.catchup.check')) {
            return;
        }

        // Debounce: only write if last update was more than 60 seconds ago
        if ($user->last_catchup_at !== null && now()->diffInSeconds($user->last_catchup_at) < 60) {
            return;
        }

        $user->updateQuietly(['last_catchup_at' => now()]);
    }
}
