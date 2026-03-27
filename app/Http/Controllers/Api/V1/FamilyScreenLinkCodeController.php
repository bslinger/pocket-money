<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\FamilyUpdated;
use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\FamilyScreenDevice;
use App\Models\FamilyScreenLinkCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FamilyScreenLinkCodeController extends Controller
{
    public function store(Request $request, Family $family): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $code = FamilyScreenLinkCode::create([
            'family_id' => $family->id,
            'code' => FamilyScreenLinkCode::generateCode(),
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        /** @var Carbon $expiresAt */
        $expiresAt = $code->expires_at;

        return response()->json([
            'data' => [
                'id' => $code->id,
                'code' => $code->code,
                'family_name' => $family->name,
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

        $linkCode = FamilyScreenLinkCode::where('code', strtoupper($request->code))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $linkCode) {
            return response()->json(['message' => 'Invalid or expired link code.'], 422);
        }

        $linkCode->update(['used_at' => now()]);

        /** @var Family $family */
        $family = $linkCode->family;

        $device = FamilyScreenDevice::createForFamily(
            $family,
            $request->input('device_name', ''),
        );

        broadcast(new FamilyUpdated($family));

        return response()->json([
            'data' => [
                'token' => $device->plainToken,
                'device_id' => $device->id,
                'family' => [
                    'id' => $family->id,
                    'name' => $family->name,
                    'currency_symbol' => $family->currency_symbol,
                ],
            ],
        ]);
    }

    public function devices(Request $request, Family $family): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $devices = $family->familyScreenDevices()
            ->whereNull('revoked_at')
            ->orderByDesc('last_active_at')
            ->get()
            /** @phpstan-ignore argument.type, argument.unresolvableType */
            ->map(fn (FamilyScreenDevice $d): array => [
                'id' => $d->id,
                'device_name' => $d->device_name,
                /** @phpstan-ignore method.nonObject */
                'last_active_at' => $d->last_active_at?->toIso8601String(),
                'created_at' => $d->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $devices]);
    }

    public function revokeDevice(Request $request, FamilyScreenDevice $device): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Family $family */
        $family = $device->family;

        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $device->revoke();

        broadcast(new FamilyUpdated($family));

        return response()->json(['message' => 'Device revoked.']);
    }
}
