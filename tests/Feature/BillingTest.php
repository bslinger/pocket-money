<?php

use App\Models\Family;

describe('billing', function () {

    describe('index', function () {
        it('renders the billing page for a parent', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page->component('Billing/Index'));
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->get(route('billing'))
                ->assertForbidden();
        });

        it('shows trial status when family is on trial', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Billing/Index')
                    ->where('on_trial', true)
                    ->where('frozen', false)
                );
        });

        it('shows frozen state when trial has expired', function () {
            [$user, $family] = parentWithFamily();
            $family->forceFill(['trial_ends_at' => now()->subDay()])->save();

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Billing/Index')
                    ->where('on_trial', false)
                    ->where('frozen', true)
                );
        });
    });

    describe('trial', function () {
        it('sets a 14-day trial when creating a family', function () {
            $family = Family::create(['name' => 'Test Family']);

            expect($family->trial_ends_at)->not->toBeNull();
            expect($family->onTrial())->toBeTrue();
            expect((int) abs($family->trial_ends_at->diffInDays(now())))->toBeBetween(13, 14);
        });

        it('gives active access during trial', function () {
            $family = Family::create(['name' => 'Test Family']);

            expect($family->hasActiveAccess())->toBeTrue();
        });

        it('denies active access after trial expires', function () {
            $family = Family::create(['name' => 'Test Family']);
            $family->forceFill(['trial_ends_at' => now()->subDay()])->save();
            $family->refresh();

            expect($family->hasActiveAccess())->toBeFalse();
        });
    });

    describe('subscription enforcement middleware', function () {
        it('allows GET requests when trial has expired (frozen state)', function () {
            [$user, $family] = parentWithFamily();
            $family->forceFill(['trial_ends_at' => now()->subDay()])->save();
            session(['active_family_id' => $family->id]);

            $this->actingAs($user)
                ->get(route('spenders.index'))
                ->assertOk();
        });

        it('blocks POST requests when trial has expired', function () {
            [$user, $family] = parentWithFamily();
            $family->forceFill(['trial_ends_at' => now()->subDay()])->save();
            session(['active_family_id' => $family->id]);

            $this->actingAs($user)
                ->post(route('spenders.store'), [
                    'name' => 'New Kid',
                    'family_id' => $family->id,
                ])
                ->assertRedirect(route('billing'));
        });

        it('allows POST requests during active trial', function () {
            [$user, $family] = parentWithFamily();
            session(['active_family_id' => $family->id]);

            $response = $this->actingAs($user)
                ->post(route('spenders.store'), [
                    'name' => 'New Kid',
                    'family_id' => $family->id,
                ]);

            // Should not redirect to billing
            $response->assertRedirect();
            expect($response->headers->get('Location'))->not->toContain('/billing');
        });

        it('does not block billing routes when expired', function () {
            [$user, $family] = parentWithFamily();
            $family->forceFill(['trial_ends_at' => now()->subDay()])->save();

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk();
        });
    });

    describe('subscription status shared via Inertia', function () {
        it('shares subscription status on every page', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('dashboard'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->has('auth.subscription')
                    ->where('auth.subscription.active', true)
                    ->where('auth.subscription.on_trial', true)
                    ->where('auth.subscription.frozen', false)
                );
        });

        it('shares frozen status when trial expired', function () {
            [$user, $family] = parentWithFamily();
            $family->forceFill(['trial_ends_at' => now()->subDay()])->save();

            $this->actingAs($user)
                ->get(route('dashboard'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->where('auth.subscription.active', false)
                    ->where('auth.subscription.frozen', true)
                );
        });
    });
});
