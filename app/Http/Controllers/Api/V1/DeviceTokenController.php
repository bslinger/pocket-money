<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /**
     * Register a device token for push notifications.
     *
     * TODO: Create device_tokens migration and model when push notifications are implemented.
     * For now this is a placeholder endpoint so the mobile app can be built against it.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'platform' => ['required', 'in:ios,android'],
        ]);

        // Placeholder — will store token when push notification infrastructure is built
        return response()->json(['message' => 'Device token registered'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        // Placeholder — will remove token when push notification infrastructure is built
        return response()->json(['message' => 'Device token removed']);
    }
}
