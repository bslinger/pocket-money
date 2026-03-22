<?php

test('home page renders the new landing page component', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Marketing/Home')
            ->has('canLogin')
            ->has('canRegister')
        );
});

test('home page shows login and register options to guests', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('canLogin', true)
            ->where('canRegister', true)
        );
});

test('how it works page still renders', function () {
    $this->get('/how-it-works')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Marketing/HowItWorks'));
});

test('pricing page still renders', function () {
    $this->get('/pricing')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Marketing/Pricing'));
});
