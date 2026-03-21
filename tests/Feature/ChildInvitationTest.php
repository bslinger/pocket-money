<?php

use App\Models\ChildInvitation;
use App\Models\SpenderUser;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\ChildInvitationMail;
use Illuminate\Support\Str;

describe('child invitations', function () {

    describe('link-child (send invite)', function () {
        it('links directly when the user already exists', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = User::factory()->create();

            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender->id), ['email' => $child->email])
                ->assertRedirect();

            expect(SpenderUser::where('spender_id', $spender->id)->where('user_id', $child->id)->exists())->toBeTrue();
        });

        it('sends an invitation email when the user does not exist', function () {
            Mail::fake();
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender->id), ['email' => 'newkid@example.com'])
                ->assertRedirect();

            Mail::assertSent(ChildInvitationMail::class, fn ($m) => $m->hasTo('newkid@example.com'));

            expect(ChildInvitation::where('spender_id', $spender->id)
                ->where('email', 'newkid@example.com')
                ->exists())->toBeTrue();
        });

        it('replaces an existing pending invitation for the same email', function () {
            Mail::fake();
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => Str::random(64),
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender->id), ['email' => 'kid@example.com'])
                ->assertRedirect();

            expect(ChildInvitation::where('spender_id', $spender->id)->where('email', 'kid@example.com')->count())->toBe(1);
        });

        it('requires parent role', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = childLinkedTo($spender);

            $this->actingAs($child)
                ->post(route('spenders.link-child', $spender->id), ['email' => 'someone@example.com'])
                ->assertForbidden();
        });
    });

    describe('accept', function () {
        it('links the spender when logged-in user accepts with matching email', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = User::factory()->create(['email' => 'kid@example.com']);

            $invitation = ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => 'abc123',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($child)
                ->get(route('child-invitations.accept', 'abc123'))
                ->assertRedirect(route('dashboard'));

            expect(SpenderUser::where('spender_id', $spender->id)->where('user_id', $child->id)->exists())->toBeTrue();
            expect(ChildInvitation::find($invitation->id))->toBeNull();
        });

        it('rejects when logged-in user email does not match', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $wrong = User::factory()->create(['email' => 'wrong@example.com']);

            ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => 'abc456',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($wrong)
                ->get(route('child-invitations.accept', 'abc456'))
                ->assertRedirect(route('dashboard'));

            expect(SpenderUser::where('spender_id', $spender->id)->where('user_id', $wrong->id)->exists())->toBeFalse();
        });

        it('stores token in session and redirects to login when not authenticated', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => 'guesttoken',
                'expires_at' => now()->addDays(7),
            ]);

            $this->get(route('child-invitations.accept', 'guesttoken'))
                ->assertRedirect(route('login'));

            expect(session('pending_child_invitation'))->toBe('guesttoken');
        });

        it('returns error for expired invitation', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = User::factory()->create(['email' => 'kid@example.com']);

            ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => 'expiredtoken',
                'expires_at' => now()->subDay(),
            ]);

            $this->actingAs($child)
                ->get(route('child-invitations.accept', 'expiredtoken'))
                ->assertRedirect(route('dashboard'));

            expect(SpenderUser::where('spender_id', $spender->id)->where('user_id', $child->id)->exists())->toBeFalse();
        });
    });

    describe('cancel', function () {
        it('allows a parent to cancel a pending invitation', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $invitation = ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => Str::random(64),
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($user)
                ->delete(route('child-invitations.cancel', $invitation->id))
                ->assertRedirect();

            expect(ChildInvitation::find($invitation->id))->toBeNull();
        });
    });

    describe('claimPending (after login/register)', function () {
        it('links the spender when pending token is in session after login', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = User::factory()->create([
                'email'             => 'kid@example.com',
                'password'          => bcrypt('password'),
                'email_verified_at' => now(),
            ]);

            ChildInvitation::create([
                'spender_id' => $spender->id,
                'email'      => 'kid@example.com',
                'token'      => 'logintoken',
                'expires_at' => now()->addDays(7),
            ]);

            $this->withSession(['pending_child_invitation' => 'logintoken'])
                ->post(route('login'), ['email' => 'kid@example.com', 'password' => 'password'])
                ->assertRedirect();

            expect(SpenderUser::where('spender_id', $spender->id)->where('user_id', $child->id)->exists())->toBeTrue();
        });
    });
});
