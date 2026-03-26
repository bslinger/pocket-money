<?php

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::preventStrayRequests();
});

// ── Google ────────────────────────────────────────────────────────────────────

test('google: creates a new user from a valid id token', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-uid-123',
            'email' => 'new@example.com',
            'name' => 'New User',
            'picture' => 'https://example.com/avatar.jpg',
        ]),
    ]);

    $response = $this->postJson('/api/v1/auth/social/google', [
        'token' => 'fake-google-id-token',
        'device_name' => 'test',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['user', 'token']]);

    $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    $this->assertDatabaseHas('social_accounts', ['provider' => 'google', 'provider_id' => 'google-uid-123']);
});

test('google: links to existing user with matching email', function () {
    $user = User::factory()->create(['email' => 'existing@example.com']);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-uid-456',
            'email' => 'existing@example.com',
            'name' => 'Existing User',
        ]),
    ]);

    $response = $this->postJson('/api/v1/auth/social/google', [
        'token' => 'fake-google-id-token',
        'device_name' => 'test',
    ]);

    $response->assertOk();
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseHas('social_accounts', ['user_id' => $user->id, 'provider' => 'google']);
});

test('google: returns existing user on repeat sign in', function () {
    $user = User::factory()->create();
    SocialAccount::factory()->create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-uid-789',
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'sub' => 'google-uid-789',
            'email' => $user->email,
            'name' => $user->name,
        ]),
    ]);

    $response = $this->postJson('/api/v1/auth/social/google', [
        'token' => 'fake-google-id-token',
        'device_name' => 'test',
    ]);

    $response->assertOk();
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('social_accounts', 1);
});

test('google: returns 422 when token is invalid', function () {
    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([], 400),
    ]);

    $this->postJson('/api/v1/auth/social/google', [
        'token' => 'bad-token',
        'device_name' => 'test',
    ])->assertUnprocessable();
});

// ── Facebook ──────────────────────────────────────────────────────────────────

test('facebook: creates a new user with email', function () {
    Http::fake([
        'https://graph.facebook.com/me*' => Http::response([
            'id' => 'fb-uid-123',
            'name' => 'FB User',
            'email' => 'fb@example.com',
        ]),
    ]);

    $response = $this->postJson('/api/v1/auth/social/facebook', [
        'token' => 'fake-fb-access-token',
        'device_name' => 'test',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('social_accounts', ['provider' => 'facebook', 'provider_id' => 'fb-uid-123']);
});

test('facebook: returns 422 when facebook does not return an email', function () {
    Http::fake([
        'https://graph.facebook.com/me*' => Http::response([
            'id' => 'fb-uid-no-email',
            'name' => 'FB User',
            // no email
        ]),
    ]);

    $this->postJson('/api/v1/auth/social/facebook', [
        'token' => 'fake-fb-access-token',
        'device_name' => 'test',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('facebook: returns 422 when token is invalid', function () {
    Http::fake([
        'https://graph.facebook.com/me*' => Http::response(['error' => 'invalid token'], 400),
    ]);

    $this->postJson('/api/v1/auth/social/facebook', [
        'token' => 'bad-token',
        'device_name' => 'test',
    ])->assertUnprocessable();
});

// ── Apple ─────────────────────────────────────────────────────────────────────

test('apple: returns 422 when JWKS fetch fails', function () {
    Http::fake([
        'https://appleid.apple.com/auth/keys' => Http::response([], 500),
    ]);

    $this->postJson('/api/v1/auth/social/apple', [
        'token' => 'fake-apple-token',
        'device_name' => 'test',
    ])->assertUnprocessable();
});

test('apple: returns 422 when identity token is malformed', function () {
    Http::fake([
        'https://appleid.apple.com/auth/keys' => Http::response([
            'keys' => [
                ['kty' => 'RSA', 'kid' => 'test', 'use' => 'sig', 'alg' => 'RS256', 'n' => 'fake', 'e' => 'AQAB'],
            ],
        ]),
    ]);

    $this->postJson('/api/v1/auth/social/apple', [
        'token' => 'not.a.jwt',
        'device_name' => 'test',
    ])->assertUnprocessable();
});

// ── General ───────────────────────────────────────────────────────────────────

test('returns 404 for unknown provider', function () {
    $this->postJson('/api/v1/auth/social/twitter', [
        'token' => 'fake-token',
        'device_name' => 'test',
    ])->assertNotFound();
});

test('requires token and device_name fields', function () {
    Http::fake();

    $this->postJson('/api/v1/auth/social/google', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['token', 'device_name']);
});
