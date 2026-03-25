<?php

// Landing page now lives at quiddo.com.au (GitHub Pages, /landing directory).
// The Laravel app root redirects to /login (guest) or /dashboard (authenticated).

test('root redirects guests to login', function () {
    $this->get('/')->assertRedirect('/login');
});

test('root redirects authenticated users to dashboard', function () {
    [$user] = parentWithFamily();
    $this->actingAs($user)->get('/')->assertRedirect('/dashboard');
});

test('old marketing routes no longer exist', function () {
    $this->get('/how-it-works')->assertNotFound();
    $this->get('/pricing')->assertNotFound();
});
