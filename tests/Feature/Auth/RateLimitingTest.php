<?php

use Illuminate\Support\Facades\Cache;

beforeEach(fn () => Cache::flush());

// ---------------------------------------------------------------------------
// Web — login
// ---------------------------------------------------------------------------

it('rate limits web login after 5 attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->post('/login', ['email' => 'test@example.com', 'password' => 'wrong']);
    }

    $this->post('/login', ['email' => 'test@example.com', 'password' => 'wrong'])
        ->assertStatus(429);
});

it('redirects back with flash error for throttled inertia login', function () {
    $headers = ['X-Inertia' => 'true', 'X-Inertia-Version' => '1'];

    for ($i = 0; $i < 5; $i++) {
        $this->withHeaders($headers)->post('/login', ['email' => 'test@example.com', 'password' => 'wrong']);
    }

    $this->withHeaders($headers)
        ->post('/login', ['email' => 'test@example.com', 'password' => 'wrong'])
        ->assertRedirect()
        ->assertSessionHas('error', 'Too many attempts. Please wait a moment and try again.');
});

// ---------------------------------------------------------------------------
// Web — register
// ---------------------------------------------------------------------------

it('rate limits web register after 10 attempts', function () {
    // Use mismatched passwords so validation always fails — user never gets created/logged in,
    // and the guest middleware doesn't short-circuit before throttle can count the request.
    $payload = ['name' => 'Test', 'email' => 'new@example.com', 'password' => 'password', 'password_confirmation' => 'wrong'];

    for ($i = 0; $i < 10; $i++) {
        $this->post('/register', $payload);
    }

    $this->post('/register', $payload)
        ->assertStatus(429);
});

// ---------------------------------------------------------------------------
// Web — forgot password
// ---------------------------------------------------------------------------

it('rate limits web forgot password after 3 attempts', function () {
    for ($i = 0; $i < 3; $i++) {
        $this->post('/forgot-password', ['email' => 'test@example.com']);
    }

    $this->post('/forgot-password', ['email' => 'test@example.com'])
        ->assertStatus(429);
});

// ---------------------------------------------------------------------------
// API — login
// ---------------------------------------------------------------------------

it('rate limits api login after 5 attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/auth/login', ['email' => 'test@example.com', 'password' => 'wrong', 'device_name' => 'test']);
    }

    $this->postJson('/api/v1/auth/login', ['email' => 'test@example.com', 'password' => 'wrong', 'device_name' => 'test'])
        ->assertStatus(429)
        ->assertJsonStructure(['message']);
});

// ---------------------------------------------------------------------------
// API — register
// ---------------------------------------------------------------------------

it('rate limits api register after 10 attempts', function () {
    $payload = ['name' => 'Test', 'email' => 'new@example.com', 'password' => 'password', 'password_confirmation' => 'password', 'device_name' => 'test'];

    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/v1/auth/register', $payload);
    }

    $this->postJson('/api/v1/auth/register', $payload)
        ->assertStatus(429)
        ->assertJsonStructure(['message']);
});

// ---------------------------------------------------------------------------
// API — forgot password
// ---------------------------------------------------------------------------

it('rate limits api forgot password after 3 attempts', function () {
    for ($i = 0; $i < 3; $i++) {
        $this->postJson('/api/v1/forgot-password', ['email' => 'test@example.com']);
    }

    $this->postJson('/api/v1/forgot-password', ['email' => 'test@example.com'])
        ->assertStatus(429)
        ->assertJsonStructure(['message']);
});

// ---------------------------------------------------------------------------
// API — social auth
// ---------------------------------------------------------------------------

it('rate limits api social auth after 10 attempts', function () {
    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/v1/auth/social/google', ['token' => 'bad-token', 'device_name' => 'test']);
    }

    $this->postJson('/api/v1/auth/social/google', ['token' => 'bad-token', 'device_name' => 'test'])
        ->assertStatus(429)
        ->assertJsonStructure(['message']);
});
