<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\PushToken;
use App\Models\Spender;
use App\Models\SpenderDevice;
use App\Notifications\BulkChoresApproved;
use App\Notifications\ChoreApproved;
use App\Notifications\ChoreDeclined;
use App\Notifications\ChoreSubmittedForApproval;
use App\Notifications\PocketMoneyReceived;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Notification;

describe('notification dispatch', function () {
    it('notifies parents when a chore is submitted for approval', function () {
        Notification::fake();
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $chore = Chore::factory()->create([
            'family_id' => $family->id,
            'requires_approval' => true,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spender->id,
            'status' => 'pending',
            'completed_at' => now(),
        ]);

        NotificationService::choreSubmittedForApproval($completion);

        Notification::assertSentTo($user, ChoreSubmittedForApproval::class);
    });

    it('notifies spender when a chore is approved', function () {
        Notification::fake();
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $completion = ChoreCompletion::factory()->create([
            'spender_id' => $spender->id,
            'status' => 'approved',
        ]);

        NotificationService::choreApproved($completion);

        Notification::assertSentTo($spender, ChoreApproved::class);
    });

    it('notifies spender when a chore is declined', function () {
        Notification::fake();
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $completion = ChoreCompletion::factory()->create([
            'spender_id' => $spender->id,
            'status' => 'declined',
        ]);

        NotificationService::choreDeclined($completion);

        Notification::assertSentTo($spender, ChoreDeclined::class);
    });

    it('notifies unique spenders on bulk approval', function () {
        Notification::fake();
        [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);
        $emma = $spenders[0];
        $jack = $spenders[1];

        $c1 = ChoreCompletion::factory()->create(['spender_id' => $emma->id, 'status' => 'approved']);
        $c2 = ChoreCompletion::factory()->create(['spender_id' => $emma->id, 'status' => 'approved']);
        $c3 = ChoreCompletion::factory()->create(['spender_id' => $jack->id, 'status' => 'approved']);

        NotificationService::bulkChoresApproved(collect([$c1, $c2, $c3]));

        Notification::assertSentTo($emma, BulkChoresApproved::class);
        Notification::assertSentTo($jack, BulkChoresApproved::class);
    });

    it('notifies spender when pocket money is paid', function () {
        Notification::fake();
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        NotificationService::pocketMoneyPaid($spender);

        Notification::assertSentTo($spender, PocketMoneyReceived::class);
    });

    it('does not fail when spender has no push tokens', function () {
        Notification::fake();
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        // No push tokens registered — should not throw
        NotificationService::pocketMoneyPaid($spender);

        Notification::assertSentTo($spender, PocketMoneyReceived::class);
    });
});
