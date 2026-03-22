<?php

use App\Enums\FamilyRole;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\User;

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

        it('only shows families where user is billing owner', function () {
            [$user, $ownedFamily] = parentWithFamily();

            // Create another family where user is a member but not billing owner
            $otherUser = User::factory()->create();
            $otherFamily = Family::factory()->create(['billing_user_id' => $otherUser->id]);
            FamilyUser::create(['family_id' => $otherFamily->id, 'user_id' => $user->id, 'role' => FamilyRole::Admin]);

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Billing/Index')
                    ->has('families', 1)
                    ->where('families.0.id', $ownedFamily->id)
                );
        });

        it('shows all billing-owned families', function () {
            [$user, $family1] = parentWithFamily();
            $family2 = Family::factory()->create(['billing_user_id' => $user->id]);
            FamilyUser::create(['family_id' => $family2->id, 'user_id' => $user->id, 'role' => FamilyRole::Admin]);

            $this->actingAs($user)
                ->get(route('billing'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->has('families', 2)
                );
        });
    });

    describe('trial', function () {
        it('grants a 14-day trial on first family', function () {
            [$user, $family] = parentWithFamily();

            expect($family->trial_ends_at)->not->toBeNull();
            expect($family->onTrial())->toBeTrue();
            expect($family->hasActiveAccess())->toBeTrue();
        });

        it('does not grant trial on second family', function () {
            [$user, $firstFamily] = parentWithFamily();

            $secondFamily = Family::factory()->create(['billing_user_id' => $user->id]);
            FamilyUser::create(['family_id' => $secondFamily->id, 'user_id' => $user->id, 'role' => FamilyRole::Admin]);
            $secondFamily->grantTrialIfEligible($user);

            expect($firstFamily->onTrial())->toBeTrue();
            expect($secondFamily->onTrial())->toBeFalse();
        });

        it('denies active access after trial expires', function () {
            [$user, $family] = parentWithFamily();
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

    describe('billing ownership', function () {
        it('sets billing_user_id when creating a family', function () {
            [$user, $family] = parentWithFamily();

            expect($family->billing_user_id)->toBe($user->id);
            expect($family->isBillingUser($user))->toBeTrue();
        });

        it('non-billing user cannot access checkout', function () {
            [$owner, $family] = parentWithFamily();
            $other = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $other->id, 'role' => FamilyRole::Admin]);

            $this->actingAs($other)
                ->post(route('billing.checkout'), [
                    'plan' => 'monthly',
                    'family_id' => $family->id,
                ])
                ->assertNotFound();
        });
    });
});
