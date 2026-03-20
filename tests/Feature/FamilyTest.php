<?php

use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\User;
use App\Enums\FamilyRole;

describe('families', function () {

    describe('index', function () {
        it('lists families for authenticated user', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('families.index'))
                ->assertOk()
                ->assertInertia(fn($page) => $page
                    ->component('Families/Index')
                    ->has('families', 1)
                );
        });

        it('requires authentication', function () {
            $this->get(route('families.index'))->assertRedirect(route('login'));
        });
    });

    describe('create / store', function () {
        it('shows the create form', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->get(route('families.create'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Families/Create'));
        });

        it('creates a family and assigns the user as admin', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('families.store'), ['name' => 'The Smiths'])
                ->assertRedirect();

            $family = Family::where('name', 'The Smiths')->first();
            expect($family)->not->toBeNull();

            $pivot = FamilyUser::where('family_id', $family->id)
                ->where('user_id', $user->id)
                ->first();
            expect($pivot->role)->toBe(FamilyRole::Admin);
        });

        it('validates that name is required', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('families.store'), [])
                ->assertSessionHasErrors('name');
        });
    });

    describe('show', function () {
        it('shows the family to a member', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('families.show', $family))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Families/Show'));
        });
    });

    describe('update', function () {
        it('updates the family name', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->patch(route('families.update', $family), ['name' => 'Updated Family'])
                ->assertRedirect();

            expect($family->fresh()->name)->toBe('Updated Family');
        });
    });

    describe('destroy', function () {
        it('deletes the family', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->delete(route('families.destroy', $family))
                ->assertRedirect(route('families.index'));

            expect(Family::find($family->id))->toBeNull();
        });
    });

    describe('invite', function () {
        it('adds an existing user to the family', function () {
            [$user, $family] = parentWithFamily();
            $invitee = User::factory()->create();

            $this->actingAs($user)
                ->post(route('families.invite', $family), ['email' => $invitee->email])
                ->assertRedirect();

            expect(FamilyUser::where('family_id', $family->id)
                ->where('user_id', $invitee->id)
                ->exists()
            )->toBeTrue();
        });

        it('returns 404 for unknown email', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->post(route('families.invite', $family), ['email' => 'nobody@example.com'])
                ->assertNotFound();
        });

        it('does not duplicate an existing member', function () {
            [$user, $family] = parentWithFamily();
            $invitee = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $invitee->id, 'role' => FamilyRole::Member]);

            $this->actingAs($user)
                ->post(route('families.invite', $family), ['email' => $invitee->email]);

            expect(FamilyUser::where('family_id', $family->id)
                ->where('user_id', $invitee->id)
                ->count()
            )->toBe(1);
        });
    });
});
