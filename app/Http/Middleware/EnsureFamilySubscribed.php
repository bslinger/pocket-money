<?php

namespace App\Http\Middleware;

use App\Models\Family;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFamilySubscribed
{
    /**
     * Block write operations when the active family has no subscription or trial.
     * GET/HEAD requests pass through so users can view their data in a frozen state.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isParent()) {
            return $next($request);
        }

        $family = $this->resolveActiveFamily($request);

        if (! $family || $family->hasActiveAccess()) {
            return $next($request);
        }

        // Allow read-only access (frozen state)
        if ($request->isMethodSafe()) {
            return $next($request);
        }

        // Block write operations — redirect to billing
        if ($request->expectsJson() || $request->header('X-Inertia')) {
            return redirect()->route('billing');
        }

        return redirect()->route('billing')
            ->with('error', 'Your subscription has expired. Please subscribe to continue.');
    }

    private function resolveActiveFamily(Request $request): ?Family
    {
        $familyId = $request->session()->get('active_family_id');

        if (! $familyId) {
            return $request->user()->families()->first();
        }

        return Family::find($familyId);
    }
}
