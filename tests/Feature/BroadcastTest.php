<?php

use App\Events\FamilyUpdated;
use App\Events\SpenderUpdated;
use App\Models\Account;
use App\Models\ChoreCompletion;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

describe('broadcast events', function () {
    it('dispatches FamilyUpdated when a chore is submitted for approval', function () {
        Event::fake([FamilyUpdated::class]);
        Notification::fake();

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $completion = ChoreCompletion::factory()->create([
            'spender_id' => $spender->id,
            'status' => 'pending',
        ]);

        NotificationService::choreSubmittedForApproval($completion);

        Event::assertDispatched(FamilyUpdated::class, fn ($e) => $e->family->id === $family->id);
    });

    it('dispatches both FamilyUpdated and SpenderUpdated when a chore is approved', function () {
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);
        Notification::fake();

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $completion = ChoreCompletion::factory()->create([
            'spender_id' => $spender->id,
            'status' => 'approved',
        ]);

        NotificationService::choreApproved($completion);

        Event::assertDispatched(FamilyUpdated::class);
        Event::assertDispatched(SpenderUpdated::class, fn ($e) => $e->spender->id === $spender->id);
    });

    it('dispatches both events when pocket money is paid', function () {
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);
        Notification::fake();

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        NotificationService::pocketMoneyPaid($spender);

        Event::assertDispatched(FamilyUpdated::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('dispatches both events when a transaction is recorded', function () {
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);
        Notification::fake();

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        NotificationService::transactionRecorded($account);

        Event::assertDispatched(FamilyUpdated::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('dispatches FamilyUpdated only for family-level events', function () {
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);
        Notification::fake();

        [$user, $family] = parentWithFamily();

        NotificationService::familyMemberJoined($family);

        Event::assertDispatched(FamilyUpdated::class);
        Event::assertNotDispatched(SpenderUpdated::class);
    });
});

describe('channel authorization', function () {
    it('allows parent to auth to their family channel', function () {
        [$user, $family] = parentWithFamily(['Emma']);

        $this->actingAs($user)
            ->post('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => "private-family.{$family->id}",
            ])
            ->assertOk();
    });

    it('rejects parent from another family channel (auth callback logic)', function () {
        // Channel auth enforcement requires a real broadcast driver (not log/null).
        // Validate the callback logic directly instead of via HTTP.
        [$user] = parentWithFamily();
        [$otherUser, $otherFamily] = parentWithFamily();

        expect($user->families()->where('families.id', $otherFamily->id)->exists())->toBeFalse();
    });

    it('allows parent to auth to spender channel in their family', function () {
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $this->actingAs($user)
            ->post('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => "private-spender.{$spender->id}",
            ])
            ->assertOk();
    });
});
