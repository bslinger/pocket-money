<?php

use App\Mail\FamilyInvitation;
use App\Models\FamilyUser;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

describe('invitations', function () {

    describe('invite existing user', function () {
        it('adds an existing user directly without sending an email', function () {
            [$admin, $family] = parentWithFamily();
            $newUser = User::factory()->create(['email' => 'newparent@example.com']);

            Mail::fake();

            $this->actingAs($admin)
                ->post(route('families.invite', $family), ['email' => 'newparent@example.com'])
                ->assertRedirect();

            Mail::assertNothingSent();
            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $newUser->id)->exists())->toBeTrue();
        });
    });

    describe('invite new user', function () {
        it('creates an invitation and sends an email', function () {
            [$admin, $family] = parentWithFamily();

            Mail::fake();

            $this->actingAs($admin)
                ->post(route('families.invite', $family), ['email' => 'stranger@example.com'])
                ->assertRedirect();

            Mail::assertSent(FamilyInvitation::class, fn ($mail) => $mail->hasTo('stranger@example.com'));

            expect(Invitation::where('email', 'stranger@example.com')
                ->where('family_id', $family->id)
                ->exists())->toBeTrue();
        });

        it('re-sends an invitation if one already exists', function () {
            [$admin, $family] = parentWithFamily();

            Mail::fake();

            $this->actingAs($admin)->post(route('families.invite', $family), ['email' => 'stranger@example.com']);
            $this->actingAs($admin)->post(route('families.invite', $family), ['email' => 'stranger@example.com']);

            // Only one invitation record should exist (upserted)
            expect(Invitation::where('email', 'stranger@example.com')->count())->toBe(1);
            // Two emails were sent
            Mail::assertSentCount(2);
        });
    });

    describe('accept invitation (unauthenticated)', function () {
        it('redirects unauthenticated users to login', function () {
            [$_admin, $family] = parentWithFamily();

            Invitation::create([
                'family_id' => $family->id,
                'email' => 'invitee@example.com',
                'token' => 'guest_token',
                'role' => 'member',
                'expires_at' => now()->addDays(7),
            ]);

            $this->get(route('invitations.accept', 'guest_token'))
                ->assertRedirect(route('login'));
        });
    });

    describe('accept invitation', function () {
        it('adds the user to the family when they accept with matching email', function () {
            [$admin, $family] = parentWithFamily();
            $invitee = User::factory()->create(['email' => 'invitee@example.com']);

            $invitation = Invitation::create([
                'family_id' => $family->id,
                'email' => 'invitee@example.com',
                'token' => 'abc123token',
                'role' => 'member',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($invitee)
                ->get(route('invitations.accept', 'abc123token'))
                ->assertRedirect(route('dashboard'));

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $invitee->id)->exists())->toBeTrue();
            expect(Invitation::find($invitation->id))->toBeNull(); // consumed
        });

        it('rejects an expired invitation', function () {
            [$admin, $family] = parentWithFamily();
            $invitee = User::factory()->create(['email' => 'invitee@example.com']);

            Invitation::create([
                'family_id' => $family->id,
                'email' => 'invitee@example.com',
                'token' => 'expired_token',
                'role' => 'member',
                'expires_at' => now()->subDay(),
            ]);

            $this->actingAs($invitee)
                ->get(route('invitations.accept', 'expired_token'))
                ->assertRedirect(route('dashboard'));

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $invitee->id)->exists())->toBeFalse();
        });

        it('rejects if logged-in email does not match invite email', function () {
            [$admin, $family] = parentWithFamily();
            $wrongUser = User::factory()->create(['email' => 'wrong@example.com']);

            Invitation::create([
                'family_id' => $family->id,
                'email' => 'invitee@example.com',
                'token' => 'mismatch_token',
                'role' => 'member',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($wrongUser)
                ->get(route('invitations.accept', 'mismatch_token'))
                ->assertRedirect(route('dashboard'));

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $wrongUser->id)->exists())->toBeFalse();
        });
    });
});
