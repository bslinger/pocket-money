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

    describe('update currency', function () {
        it('updates currency name and symbol', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->patch(route('families.update', $family), [
                    'name'            => $family->name,
                    'currency_name'   => 'Star',
                    'currency_symbol' => '⭐',
                ])
                ->assertRedirect();

            $family->refresh();
            expect($family->currency_name)->toBe('Star');
            expect($family->currency_symbol)->toBe('⭐');
        });
    });

    describe('remove member', function () {
        it('removes a member from the family', function () {
            [$admin, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            $this->actingAs($admin)
                ->delete(route('families.members.destroy', [$family, $member]))
                ->assertRedirect();

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $member->id)->exists())->toBeFalse();
        });

        it('prevents removing the last admin', function () {
            [$admin, $family] = parentWithFamily();

            $this->actingAs($admin)
                ->delete(route('families.members.destroy', [$family, $admin]))
                ->assertSessionHasErrors('member');

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $admin->id)->exists())->toBeTrue();
        });

        it('allows removing an admin when another admin exists', function () {
            [$admin1, $family] = parentWithFamily();
            $admin2 = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $admin2->id, 'role' => FamilyRole::Admin]);

            $this->actingAs($admin1)
                ->delete(route('families.members.destroy', [$family, $admin2]))
                ->assertRedirect();

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $admin2->id)->exists())->toBeFalse();
        });
    });

    describe('update member role', function () {
        it('promotes a member to admin', function () {
            [$admin, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            $this->actingAs($admin)
                ->patch(route('families.members.role', [$family, $member]), ['role' => 'admin'])
                ->assertRedirect();

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $member->id)->first()->role)
                ->toBe(FamilyRole::Admin);
        });

        it('demotes an admin to member', function () {
            [$admin, $family] = parentWithFamily();
            $admin2 = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $admin2->id, 'role' => FamilyRole::Admin]);

            $this->actingAs($admin)
                ->patch(route('families.members.role', [$family, $admin2]), ['role' => 'member'])
                ->assertRedirect();

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $admin2->id)->first()->role)
                ->toBe(FamilyRole::Member);
        });

        it('validates that role must be admin or member', function () {
            [$admin, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            $this->actingAs($admin)
                ->patch(route('families.members.role', [$family, $member]), ['role' => 'superuser'])
                ->assertSessionHasErrors('role');
        });
    });

    describe('switch active', function () {
        it('stores the family id in the session', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->post(route('families.switch', $family))
                ->assertRedirect(route('dashboard'))
                ->assertSessionHas('active_family_id', $family->id);
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
