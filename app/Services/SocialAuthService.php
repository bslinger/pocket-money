<?php

namespace App\Services;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Auth\Events\Registered;

class SocialAuthService
{
    /**
     * Data normalised from any social provider — Socialite or mobile SDK token verification.
     *
     * @param array{
     *   provider: string,
     *   provider_id: string,
     *   email: string|null,
     *   name: string|null,
     *   avatar_url: string|null,
     *   token: string|null,
     *   refresh_token: string|null,
     *   uses_apple_relay: bool,
     * } $data
     */
    public function findOrCreateUser(array $data): User
    {
        // 1. Existing social account → return the linked user
        $socialAccount = SocialAccount::where('provider', $data['provider'])
            ->where('provider_id', $data['provider_id'])
            ->first();

        if ($socialAccount) {
            $this->updateSocialAccount($socialAccount, $data);

            return $socialAccount->user;
        }

        // 2. Email matches an existing user → link provider, return user
        if ($data['email']) {
            $user = User::where('email', $data['email'])->first();

            if ($user) {
                $this->createSocialAccount($user, $data);

                if ($data['uses_apple_relay']) {
                    $user->update(['uses_apple_relay' => true]);
                }

                return $user;
            }
        }

        // 3. New user
        $user = User::create([
            'name' => $data['name'] ?? 'User',
            'email' => $data['email'],
            'avatar_url' => $data['avatar_url'],
            'uses_apple_relay' => $data['uses_apple_relay'],
        ]);

        if ($data['email']) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $this->createSocialAccount($user, $data);

        event(new Registered($user));

        return $user;
    }

    /**
     * @param array{
     *   provider: string,
     *   provider_id: string,
     *   email: string|null,
     *   name: string|null,
     *   avatar_url: string|null,
     *   token: string|null,
     *   refresh_token: string|null,
     *   uses_apple_relay: bool,
     * } $data
     */
    private function createSocialAccount(User $user, array $data): void
    {
        $user->socialAccounts()->create([
            'provider' => $data['provider'],
            'provider_id' => $data['provider_id'],
            'email' => $data['email'],
            'name' => $data['name'],
            'avatar_url' => $data['avatar_url'],
            'token' => $data['token'],
            'refresh_token' => $data['refresh_token'],
        ]);
    }

    /**
     * @param array{
     *   token: string|null,
     *   refresh_token: string|null,
     *   name: string|null,
     *   avatar_url: string|null,
     *   uses_apple_relay: bool,
     * } $data
     */
    private function updateSocialAccount(SocialAccount $socialAccount, array $data): void
    {
        $updates = [
            'token' => $data['token'],
            'refresh_token' => $data['refresh_token'],
        ];

        // Never overwrite name/avatar with empty values (Apple omits them after first auth)
        if ($data['name']) {
            $updates['name'] = $data['name'];
        }

        if ($data['avatar_url']) {
            $updates['avatar_url'] = $data['avatar_url'];
        }

        $socialAccount->update($updates);
    }
}
