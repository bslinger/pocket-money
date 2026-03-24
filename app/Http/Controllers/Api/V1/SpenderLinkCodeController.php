<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\Spender;
use App\Models\SpenderDevice;
use App\Models\SpenderLinkCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SpenderLinkCodeController extends Controller
{
    public function store(Request $request, Spender $spender): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Family $family */
        $family = $spender->family;

        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $code = SpenderLinkCode::create([
            'spender_id' => $spender->id,
            'family_id' => $family->id,
            'code' => SpenderLinkCode::generateCode(),
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        /** @var Carbon $expiresAt */
        $expiresAt = $code->expires_at;

        return response()->json([
            'data' => [
                'id' => $code->id,
                'code' => $code->code,
                'spender_name' => $spender->name,
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ], 201);
    }

    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $linkCode = SpenderLinkCode::where('code', strtoupper($request->code))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $linkCode) {
            return response()->json([
                'message' => 'Invalid or expired link code.',
            ], 422);
        }

        $linkCode->update(['used_at' => now()]);

        /** @var Spender $spender */
        $spender = $linkCode->spender;

        $device = SpenderDevice::createForSpender(
            $spender,
            $request->input('device_name', ''),
        );

        $spender->load('family');

        /** @var Family $spenderFamily */
        $spenderFamily = $spender->family;

        return response()->json([
            'data' => [
                'token' => $device->plainToken,
                'device_id' => $device->id,
                'spender' => [
                    'id' => $spender->id,
                    'name' => $spender->name,
                    'color' => $spender->color,
                    'family_name' => $spenderFamily->name,
                ],
            ],
        ]);
    }

    public function devices(Request $request, Spender $spender): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Family $family */
        $family = $spender->family;

        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $devices = $spender->devices()
            ->whereNull('revoked_at')
            ->orderByDesc('last_active_at')
            ->get()
            /** @phpstan-ignore argument.unresolvableType */
            ->map(fn (SpenderDevice $d): array => [
                'id' => $d->id,
                'device_name' => $d->device_name,
                /** @phpstan-ignore method.nonObject */
                'last_active_at' => $d->last_active_at?->toIso8601String(),
                'created_at' => $d->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $devices]);
    }

    public function revokeDevice(Request $request, SpenderDevice $device): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Spender $spender */
        $spender = $device->spender;

        /** @var Family $family */
        $family = $spender->family;

        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $device->revoke();

        return response()->json(['message' => 'Device revoked.']);
    }
}
