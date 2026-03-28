<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\FacebookProvider;
use Laravel\Socialite\Two\User as OAuth2User;

class SocialAuthController extends Controller
{
    public function __construct(private readonly SocialAuthService $socialAuth) {}

    public function redirect(string $provider): \Symfony\Component\HttpFoundation\RedirectResponse
    {
        $this->validateProvider($provider);

        if ($provider === 'facebook') {
            /** @var FacebookProvider $driver */
            $driver = Socialite::driver($provider);

            return $driver->scopes(['email'])->reRequest()->redirect();
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
        $token = $socialUser instanceof OAuth2User ? $socialUser->token : null;
        $refreshToken = $socialUser instanceof OAuth2User ? $socialUser->refreshToken : null;

        // If the provider didn't return an email, collect it from the user directly.
        if (! $email) {
            $name = $socialUser->getName();

            session()->put('pending_social_auth', [
                'provider' => $provider,
                'provider_id' => $socialUser->getId(),
                'name' => $name,
                'avatar_url' => $socialUser->getAvatar(),
                'token' => $token,
                'refresh_token' => $refreshToken,
            ]);

            return redirect()->route('auth.social.complete-profile');
        }

        $usesRelay = $isApple && str_ends_with($email, '@privaterelay.appleid.com');

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

    public function showCompleteProfile(): Response|RedirectResponse
    {
        if (! session()->has('pending_social_auth')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/CompleteProfile', [
            'name' => session('pending_social_auth.name'),
        ]);
    }

    public function completeProfile(Request $request): RedirectResponse
    {
        if (! session()->has('pending_social_auth')) {
            return redirect()->route('login');
        }

        $request->validate([
            'email' => ['required', 'email', Rule::unique('users', 'email')],
        ]);

        /** @var array{provider: string, provider_id: string, name: string|null, avatar_url: string|null, token: string|null, refresh_token: string|null} $pending */
        $pending = session()->pull('pending_social_auth');

        $user = $this->socialAuth->findOrCreateUser([
            'provider' => $pending['provider'],
            'provider_id' => $pending['provider_id'],
            'email' => $request->email,
            'name' => $pending['name'],
            'avatar_url' => $pending['avatar_url'],
            'token' => $pending['token'],
            'refresh_token' => $pending['refresh_token'],
            'uses_apple_relay' => false,
        ]);

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function validateProvider(string $provider): void
    {
        abort_unless(in_array($provider, ['google', 'apple', 'facebook']), 404);
    }
}
