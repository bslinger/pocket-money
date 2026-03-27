<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireStagingAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('app.env') !== 'staging') {
            return $next($request);
        }

        $expectedUser = config('app.staging_auth_user');
        $expectedPass = config('app.staging_auth_pass');

        if (
            $expectedUser === null ||
            $request->getUser() !== $expectedUser ||
            $request->getPassword() !== $expectedPass
        ) {
            return response('Unauthorized', 401, [
                'WWW-Authenticate' => 'Basic realm="Staging"',
                'X-Robots-Tag' => 'noindex, nofollow',
            ]);
        }

        $response = $next($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
