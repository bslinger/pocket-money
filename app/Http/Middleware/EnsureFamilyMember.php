<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Family;

class EnsureFamilyMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $family = $request->route('family');
        if ($family instanceof Family) {
            if (!$family->users()->where('user_id', $request->user()->id)->exists()) {
                abort(403, 'Not a family member.');
            }
        }
        return $next($request);
    }
}
