<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireParent
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->isParent()) {
            abort(403, 'Parent access required.');
        }
        return $next($request);
    }
}
