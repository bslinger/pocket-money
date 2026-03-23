<?php

use App\Enums\FamilyRole;
use App\Models\FamilyUser;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

describe('family admin guards', function () {
    function memberOfFamily(): array
    {
        [$admin, $family] = parentWithFamily();
        $member = User::factory()->create();
        FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

        return [$admin, $member, $family];
    }

    describe('invite', function () {
        it('allows admins to invite', function () {
            Mail::fake();
            [$admin, , $family] = memberOfFamily();

            $this->actingAs($admin)
                ->post(route('families.invite', $family), ['email' => 'new@example.com'])
                ->assertRedirect();
        });

        it('blocks non-admins from inviting', function () {
            [, $member, $family] = memberOfFamily();

            $this->actingAs($member)
                ->post(route('families.invite', $family), ['email' => 'new@example.com'])
                ->assertForbidden();
        });

        it('blocks unverified users from inviting', function () {
            Mail::fake();
            [$admin, , $family] = memberOfFamily();
            $admin->forceFill(['email_verified_at' => null])->save();

            $response = $this->actingAs($admin->fresh())
                ->post(route('families.invite', $family), ['email' => 'new@example.com']);

            // abort_unless returns 403 but Inertia may convert to redirect
            expect($response->status())->toBeIn([302, 403]);
            Mail::assertNothingSent();
        });
    });

    describe('remove member', function () {
        it('allows admins to remove members', function () {
            [$admin, $member, $family] = memberOfFamily();

            $this->actingAs($admin)
                ->delete(route('families.members.destroy', ['family' => $family->id, 'user' => $member->id]))
                ->assertRedirect();

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $member->id)->exists())->toBeFalse();
        });

        it('blocks non-admins from removing members', function () {
            [$admin, $member, $family] = memberOfFamily();

            $this->actingAs($member)
                ->delete(route('families.members.destroy', ['family' => $family->id, 'user' => $admin->id]))
                ->assertForbidden();
        });
    });

    describe('update role', function () {
        it('allows admins to change roles', function () {
            [$admin, $member, $family] = memberOfFamily();

            $this->actingAs($admin)
                ->patch(route('families.members.role', ['family' => $family->id, 'user' => $member->id]), ['role' => 'admin'])
                ->assertRedirect();

            expect(FamilyUser::where('user_id', $member->id)->first()->role->value)->toBe('admin');
        });

        it('blocks non-admins from changing roles', function () {
            [$admin, $member, $family] = memberOfFamily();

            $this->actingAs($member)
                ->patch(route('families.members.role', ['family' => $family->id, 'user' => $admin->id]), ['role' => 'member'])
                ->assertForbidden();
        });
    });

    describe('revoke invitation', function () {
        it('allows admins to revoke invitations', function () {
            [$admin, , $family] = memberOfFamily();
            $invitation = Invitation::create([
                'family_id' => $family->id,
                'email' => 'pending@example.com',
                'token' => 'revoke-test-token',
                'role' => 'member',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($admin)
                ->delete(route('families.invitations.destroy', ['family' => $family->id, 'invitation' => $invitation->id]))
                ->assertRedirect();

            expect(Invitation::find($invitation->id))->toBeNull();
        });

        it('blocks non-admins from revoking invitations', function () {
            [$admin, $member, $family] = memberOfFamily();
            $invitation = Invitation::create([
                'family_id' => $family->id,
                'email' => 'pending@example.com',
                'token' => 'revoke-block-token',
                'role' => 'member',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($member)
                ->delete(route('families.invitations.destroy', ['family' => $family->id, 'invitation' => $invitation->id]))
                ->assertForbidden();
        });
    });
});
