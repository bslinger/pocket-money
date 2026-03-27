<?php

namespace App\Http\Middleware;

use App\Models\FamilyScreenDevice;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateFamilyScreenDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            abort(401, 'Authentication required.');
        }

        $hashedToken = hash('sha256', $token);
        $device = FamilyScreenDevice::findByToken($hashedToken);

        if (! $device) {
            abort(401, 'Invalid or revoked device token.');
        }

        $device->touchLastActive();

        $request->attributes->set('family_screen_device', $device);
        $request->attributes->set('family_screen_family', $device->family);

        return $next($request);
    }
}
