<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User as OAuth2User;

class SocialAuthController extends Controller
{
    public function __construct(private readonly SocialAuthService $socialAuth) {}

    public function redirect(string $provider): \Symfony\Component\HttpFoundation\RedirectResponse
    {
        $this->validateProvider($provider);

        if ($provider === 'facebook') {
            /** @var AbstractProvider $driver */
            $driver = Socialite::driver($provider);

            return $driver->scopes(['email'])->with(['auth_type' => 'rerequest'])->redirect();
        }

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        try {
            /** @var SocialiteUser $socialUser */
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable) {
            return redirect()->route('login')->withErrors(['social' => 'We could not sign you in with that account. Please try again.']);
        }

        $isApple = $provider === 'apple';
        $email = $socialUser->getEmail();

        if (! $email && $provider === 'facebook') {
            return redirect()->route('login')->withErrors(['social' => 'Your Facebook account doesn\'t have an email address. Please sign in with Google or use your email and password instead.']);
        }
        $usesRelay = $isApple && $email && str_ends_with($email, '@privaterelay.appleid.com');

        // Apple only returns the name on the first authorisation — capture it from the raw response
        $name = $socialUser->getName();
        if ($isApple && ! $name && method_exists($socialUser, 'getRaw')) {
            /** @var array<string, mixed> $raw */
            $raw = $socialUser->getRaw();
            $firstName = $raw['user']['name']['firstName'] ?? null;
            $lastName = $raw['user']['name']['lastName'] ?? null;
            if ($firstName || $lastName) {
                $name = trim("$firstName $lastName") ?: null;
            }
        }

        $token = $socialUser instanceof OAuth2User ? $socialUser->token : null;
        $refreshToken = $socialUser instanceof OAuth2User ? $socialUser->refreshToken : null;

        $user = $this->socialAuth->findOrCreateUser([
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'email' => $email,
            'name' => $name,
            'avatar_url' => $socialUser->getAvatar(),
            'token' => $token,
            'refresh_token' => $refreshToken,
            'uses_apple_relay' => $usesRelay,
        ]);

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function validateProvider(string $provider): void
    {
        abort_unless(in_array($provider, ['google', 'apple', 'facebook']), 404);
    }
}
