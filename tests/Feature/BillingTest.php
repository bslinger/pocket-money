<?php

describe('billing', function () {

    describe('index', function () {
        it('renders the billing page for a parent', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Billing/Index'));
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->get(route('billing'))
                ->assertForbidden();
        });
    });
});
