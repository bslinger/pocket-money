<?php

use App\Enums\FamilyRole;
use App\Mail\BillingTransferMail;
use App\Models\BillingTransferInvitation;
use App\Models\FamilyUser;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

describe('billing transfer', function () {

    describe('initiate', function () {
        it('sends a transfer email to a family member', function () {
            Mail::fake();

            [$owner, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            $this->actingAs($owner)
                ->post(route('billing.transfer', $family), ['email' => $member->email])
                ->assertRedirect();

            Mail::assertSent(BillingTransferMail::class, fn ($mail) => $mail->hasTo($member->email));

            expect(BillingTransferInvitation::where('family_id', $family->id)->count())->toBe(1);
        });

        it('rejects transfer to yourself', function () {
            Mail::fake();

            [$owner, $family] = parentWithFamily();

            $this->actingAs($owner)
                ->post(route('billing.transfer', $family), ['email' => $owner->email])
                ->assertSessionHasErrors('email');

            Mail::assertNothingSent();
        });

        it('rejects transfer to non-member', function () {
            Mail::fake();

            [$owner, $family] = parentWithFamily();
            $stranger = User::factory()->create();

            $this->actingAs($owner)
                ->post(route('billing.transfer', $family), ['email' => $stranger->email])
                ->assertSessionHasErrors('email');

            Mail::assertNothingSent();
        });

        it('only the billing owner can initiate a transfer', function () {
            [$owner, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Admin]);

            $this->actingAs($member)
                ->post(route('billing.transfer', $family), ['email' => $owner->email])
                ->assertForbidden();
        });
    });

    describe('accept', function () {
        it('transfers billing ownership when accepted', function () {
            [$owner, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            $invitation = BillingTransferInvitation::create([
                'family_id' => $family->id,
                'from_user_id' => $owner->id,
                'to_email' => $member->email,
                'token' => 'test-token-123',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($member)
                ->get(route('billing.transfer.accept', 'test-token-123'))
                ->assertRedirect(route('billing'));

            $family->refresh();
            expect($family->billing_user_id)->toBe($member->id);
            expect(BillingTransferInvitation::find($invitation->id))->toBeNull();
        });

        it('rejects expired invitations', function () {
            [$owner, $family] = parentWithFamily();
            $member = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            BillingTransferInvitation::create([
                'family_id' => $family->id,
                'from_user_id' => $owner->id,
                'to_email' => $member->email,
                'token' => 'expired-token',
                'expires_at' => now()->subDay(),
            ]);

            $this->actingAs($member)
                ->get(route('billing.transfer.accept', 'expired-token'))
                ->assertRedirect(route('billing'))
                ->assertSessionHas('error');

            $family->refresh();
            expect($family->billing_user_id)->toBe($owner->id);
        });

        it('rejects wrong email', function () {
            [$owner, $family] = parentWithFamily();
            $member = User::factory()->create();
            $wrong = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $member->id, 'role' => FamilyRole::Member]);

            BillingTransferInvitation::create([
                'family_id' => $family->id,
                'from_user_id' => $owner->id,
                'to_email' => $member->email,
                'token' => 'wrong-user-token',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($wrong)
                ->get(route('billing.transfer.accept', 'wrong-user-token'))
                ->assertRedirect(route('billing'))
                ->assertSessionHas('error');

            $family->refresh();
            expect($family->billing_user_id)->toBe($owner->id);
        });

        it('redirects to login for unauthenticated users', function () {
            [$owner, $family] = parentWithFamily();

            BillingTransferInvitation::create([
                'family_id' => $family->id,
                'from_user_id' => $owner->id,
                'to_email' => 'someone@example.com',
                'token' => 'unauth-token',
                'expires_at' => now()->addDays(7),
            ]);

            $this->get(route('billing.transfer.accept', 'unauth-token'))
                ->assertRedirect(route('login'));
        });
    });

    describe('cancel', function () {
        it('allows the initiator to cancel a pending transfer', function () {
            [$owner, $family] = parentWithFamily();

            $invitation = BillingTransferInvitation::create([
                'family_id' => $family->id,
                'from_user_id' => $owner->id,
                'to_email' => 'someone@example.com',
                'token' => 'cancel-token',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($owner)
                ->delete(route('billing.transfer.cancel', $invitation))
                ->assertRedirect();

            expect(BillingTransferInvitation::find($invitation->id))->toBeNull();
        });

        it('prevents non-initiator from cancelling', function () {
            [$owner, $family] = parentWithFamily();
            $other = User::factory()->create();
            FamilyUser::create(['family_id' => $family->id, 'user_id' => $other->id, 'role' => FamilyRole::Admin]);

            $invitation = BillingTransferInvitation::create([
                'family_id' => $family->id,
                'from_user_id' => $owner->id,
                'to_email' => 'someone@example.com',
                'token' => 'other-cancel-token',
                'expires_at' => now()->addDays(7),
            ]);

            $this->actingAs($other)
                ->delete(route('billing.transfer.cancel', $invitation))
                ->assertForbidden();
        });
    });
});
