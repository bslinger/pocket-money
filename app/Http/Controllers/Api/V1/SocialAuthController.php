<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\SocialAccount;
use App\Services\SocialAuthService;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class SocialAuthController extends Controller
{
    public function __construct(private readonly SocialAuthService $socialAuth) {}

    public function login(Request $request, string $provider): JsonResponse
    {
        abort_unless(in_array($provider, ['google', 'apple', 'facebook']), 404);

        $request->validate([
            'token' => ['required', 'string'],
            'device_name' => ['required', 'string'],
            'email' => ['nullable', 'email'],
        ]);

        $socialData = match ($provider) {
            'google' => $this->verifyGoogle($request->token),
            'apple' => $this->verifyApple($request->token, $request->input('first_name'), $request->input('last_name')),
            'facebook' => $this->verifyFacebook($request->token),
        };

        // If the provider didn't return an email, check if this social account is already linked.
        // If so, proceed directly. If not, the client must supply an email before we can continue.
        if (empty($socialData['email'])) {
            $alreadyLinked = SocialAccount::where('provider', $socialData['provider'])
                ->where('provider_id', $socialData['provider_id'])
                ->exists();

            if (! $alreadyLinked) {
                if (empty($request->email)) {
                    return response()->json([
                        'data' => [
                            'needs_email' => true,
                            'provider_id' => $socialData['provider_id'],
                            'name' => $socialData['name'],
                        ],
                    ]);
                }

                $socialData['email'] = $request->email;
            }
        }

        $user = $this->socialAuth->findOrCreateUser($socialData);

        $sanctumToken = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $sanctumToken,
                'needs_onboarding' => $user->familyUsers()->doesntExist(),
            ],
        ]);
    }

    /**
     * Verify a Google ID token and return normalised social data.
     *
     * @return array{provider: string, provider_id: string, email: string|null, name: string|null, avatar_url: string|null, token: string|null, refresh_token: string|null, uses_apple_relay: bool}
     */
    private function verifyGoogle(string $idToken): array
    {
        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $idToken,
        ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'token' => ['The Google token is invalid or expired.'],
            ]);
        }

        $payload = $response->json();

        return [
            'provider' => 'google',
            'provider_id' => $payload['sub'],
            'email' => $payload['email'] ?? null,
            'name' => $payload['name'] ?? null,
            'avatar_url' => $payload['picture'] ?? null,
            'token' => $idToken,
            'refresh_token' => null,
            'uses_apple_relay' => false,
        ];
    }

    /**
     * Verify an Apple identity token (JWT) and return normalised social data.
     * Apple only returns name on first sign-in, so the mobile app must forward it.
     *
     * @return array{provider: string, provider_id: string, email: string|null, name: string|null, avatar_url: string|null, token: string|null, refresh_token: string|null, uses_apple_relay: bool}
     */
    private function verifyApple(string $identityToken, ?string $firstName, ?string $lastName): array
    {
        $jwksResponse = Http::get('https://appleid.apple.com/auth/keys');

        if (! $jwksResponse->successful()) {
            throw ValidationException::withMessages([
                'token' => ['Could not verify Apple token. Please try again.'],
            ]);
        }

        try {
            $keys = JWK::parseKeySet($jwksResponse->json());
            $payload = (array) JWT::decode($identityToken, $keys);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'token' => ['The Apple token is invalid or expired.'],
            ]);
        }

        $email = $payload['email'] ?? null;
        $usesRelay = $email && str_ends_with($email, '@privaterelay.appleid.com');

        $name = null;
        if ($firstName || $lastName) {
            $name = trim("$firstName $lastName") ?: null;
        }

        return [
            'provider' => 'apple',
            'provider_id' => $payload['sub'],
            'email' => $email,
            'name' => $name,
            'avatar_url' => null,
            'token' => $identityToken,
            'refresh_token' => null,
            'uses_apple_relay' => $usesRelay,
        ];
    }

    /**
     * Verify a Facebook access token and return normalised social data.
     *
     * @return array{provider: string, provider_id: string, email: string|null, name: string|null, avatar_url: string|null, token: string|null, refresh_token: string|null, uses_apple_relay: bool}
     */
    private function verifyFacebook(string $accessToken): array
    {
        $response = Http::get('https://graph.facebook.com/me', [
            'fields' => 'id,name,email,picture.type(large)',
            'access_token' => $accessToken,
        ]);

        if (! $response->successful() || ! $response->json('id')) {
            throw ValidationException::withMessages([
                'token' => ['The Facebook token is invalid or expired.'],
            ]);
        }

        $data = $response->json();

        return [
            'provider' => 'facebook',
            'provider_id' => $data['id'],
            'email' => $data['email'] ?? null,
            'name' => $data['name'] ?? null,
            'avatar_url' => $data['picture']['data']['url'] ?? null,
            'token' => $accessToken,
            'refresh_token' => null,
            'uses_apple_relay' => false,
        ];
    }
}
