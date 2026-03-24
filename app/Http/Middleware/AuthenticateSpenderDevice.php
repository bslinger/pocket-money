<?php

namespace App\Http\Middleware;

use App\Models\SpenderDevice;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateSpenderDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            abort(401, 'Authentication required.');
        }

        $hashedToken = hash('sha256', $token);
        $device = SpenderDevice::findByToken($hashedToken);

        if (! $device) {
            abort(401, 'Invalid or revoked device token.');
        }

        $device->touchLastActive();

        $request->attributes->set('spender_device', $device);
        $request->attributes->set('spender', $device->spender);

        return $next($request);
    }
}
