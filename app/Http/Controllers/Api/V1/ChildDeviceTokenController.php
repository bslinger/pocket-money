<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use App\Models\Spender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChildDeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'platform' => ['required', 'in:ios,android'],
        ]);

        /** @var Spender $spender */
        $spender = $request->attributes->get('spender');

        PushToken::register($spender, $request->token, $request->platform);

        return response()->json(['message' => 'Device token registered'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        PushToken::unregister($request->token);

        return response()->json(['message' => 'Device token removed']);
    }
}
