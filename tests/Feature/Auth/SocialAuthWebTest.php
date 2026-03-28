<?php

use App\Models\SocialAccount;
use App\Models\User;

describe('social auth callback (web)', function () {

    it('skips email collection when social account is already linked', function () {
        $user = User::factory()->create(['email' => 'jane@example.com']);
        SocialAccount::factory()->for($user)->create([
            'provider' => 'facebook',
            'provider_id' => 'fb_already_linked',
        ]);

        // Simulate the callback having verified the token and got provider_id back
        // by testing the guard logic: if linked, no pending session should be set
        // We test this indirectly via the service layer — SocialAuthService finds by provider_id
        $service = app(\App\Services\SocialAuthService::class);
        $found = $service->findOrCreateUser([
            'provider' => 'facebook',
            'provider_id' => 'fb_already_linked',
            'email' => null,
            'name' => null,
            'avatar_url' => null,
            'token' => null,
            'refresh_token' => null,
            'uses_apple_relay' => false,
        ]);

        expect($found->id)->toBe($user->id);
    });

});

describe('complete profile (web)', function () {

    it('links social account to existing user when email matches', function () {
        $user = User::factory()->create(['email' => 'jane@example.com']);

        session()->put('pending_social_auth', [
            'provider' => 'facebook',
            'provider_id' => 'fb_12345',
            'name' => 'Jane',
            'avatar_url' => null,
            'token' => 'tok',
            'refresh_token' => null,
        ]);

        $this->post(route('auth.social.complete-profile.store'), ['email' => 'jane@example.com'])
            ->assertRedirect();

        expect(SocialAccount::where('user_id', $user->id)->where('provider', 'facebook')->exists())->toBeTrue();
        $this->assertAuthenticatedAs($user);
    });

    it('creates a new user when email is not taken', function () {
        session()->put('pending_social_auth', [
            'provider' => 'facebook',
            'provider_id' => 'fb_99999',
            'name' => 'New User',
            'avatar_url' => null,
            'token' => 'tok',
            'refresh_token' => null,
        ]);

        $this->post(route('auth.social.complete-profile.store'), ['email' => 'new@example.com'])
            ->assertRedirect();

        expect(User::where('email', 'new@example.com')->exists())->toBeTrue();
        $this->assertAuthenticated();
    });

    it('redirects to login when no pending session', function () {
        $this->post(route('auth.social.complete-profile.store'), ['email' => 'any@example.com'])
            ->assertRedirect(route('login'));
    });

    it('validates email format', function () {
        session()->put('pending_social_auth', [
            'provider' => 'facebook',
            'provider_id' => 'fb_111',
            'name' => null,
            'avatar_url' => null,
            'token' => null,
            'refresh_token' => null,
        ]);

        $this->post(route('auth.social.complete-profile.store'), ['email' => 'not-an-email'])
            ->assertSessionHasErrors('email');
    });

});
