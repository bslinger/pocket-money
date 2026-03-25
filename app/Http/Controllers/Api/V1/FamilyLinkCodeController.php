<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\FamilyLinkCode;
use App\Models\FamilyUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class FamilyLinkCodeController extends Controller
{
    /**
     * Generate a family link code (authenticated parent).
     */
    public function store(Request $request, Family $family): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $family->id)->exists(), 403);

        $code = FamilyLinkCode::create([
            'family_id' => $family->id,
            'code' => FamilyLinkCode::generateCode(),
            'role' => 'member',
            'created_by' => $request->user()->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        /** @var Carbon $expiresAt */
        $expiresAt = $code->expires_at;

        return response()->json([
            'data' => [
                'code' => $code->code,
                'expires_at' => $expiresAt->toIso8601String(),
                'family_name' => $family->name,
            ],
        ], 201);
    }

    /**
     * Claim a family link code (unauthenticated — registers or logs in, then joins family).
     */
    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => ['required', Password::defaults()],
        ]);

        $linkCode = FamilyLinkCode::where('code', strtoupper($request->code))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $linkCode) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        // Find or create the user
        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Existing user — verify password
            if (! Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'An account with this email already exists. Please enter the correct password.',
                    'errors' => ['password' => ['Incorrect password for existing account.']],
                ], 422);
            }
        } else {
            // New user — register
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
        }

        // Check if already in the family
        $alreadyMember = FamilyUser::where('family_id', $linkCode->family_id)
            ->where('user_id', $user->id)
            ->exists();

        if (! $alreadyMember) {
            FamilyUser::create([
                'family_id' => $linkCode->family_id,
                'user_id' => $user->id,
                'role' => $linkCode->role,
            ]);
        }

        // Mark code as used
        $linkCode->update(['used_at' => now()]);

        // Create a Sanctum token for the mobile app
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'family' => [
                    'id' => $linkCode->family_id,
                    'name' => Family::find($linkCode->family_id)->name,
                ],
            ],
        ]);
    }
}
