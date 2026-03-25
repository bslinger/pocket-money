<?php

use App\Notifications\BulkChoresApproved;
use App\Notifications\ChildAccountLinked;
use App\Notifications\ChoreApproved;
use App\Notifications\ChoreDeclined;
use App\Notifications\ChoreSubmittedForApproval;
use App\Notifications\FamilyMemberJoined;
use App\Notifications\PocketMoneyReceived;
use App\Notifications\SavingsGoalReached;
use App\Notifications\TransactionRecorded;
use NotificationChannels\Apn\ApnChannel;
use NotificationChannels\Fcm\FcmChannel;

describe('notification content', function () {
    $notifications = [
        ['ChoreSubmittedForApproval', ChoreSubmittedForApproval::class, 'A chore needs your approval', 'quiddo://chores'],
        ['ChoreApproved', ChoreApproved::class, 'Your chore was approved!', 'quiddo://'],
        ['ChoreDeclined', ChoreDeclined::class, 'A chore needs your attention', 'quiddo://'],
        ['BulkChoresApproved', BulkChoresApproved::class, 'Your chores were approved!', 'quiddo://'],
        ['PocketMoneyReceived', PocketMoneyReceived::class, 'Pocket money received!', 'quiddo://'],
        ['SavingsGoalReached', SavingsGoalReached::class, 'A savings goal was reached!', 'quiddo://goals'],
        ['FamilyMemberJoined', FamilyMemberJoined::class, 'Someone joined your family', 'quiddo://'],
        ['ChildAccountLinked', ChildAccountLinked::class, 'A child account was linked', 'quiddo://'],
        ['TransactionRecorded', TransactionRecorded::class, 'A transaction was recorded on an account', 'quiddo://'],
    ];

    foreach ($notifications as [$name, $class, $expectedBody, $expectedDeepLink]) {
        it("$name has correct body and deep link", function () use ($class, $expectedBody, $expectedDeepLink) {
            $notification = new $class;

            // Test via() channels
            $channels = $notification->via(null);
            expect($channels)->toContain(FcmChannel::class);
            expect($channels)->toContain(ApnChannel::class);

            // Test FCM message
            $fcm = $notification->toFcm(null);
            $fcmArray = $fcm->toArray();
            expect($fcmArray['notification']['body'])->toBe($expectedBody);
            expect($fcmArray['notification']['title'])->toBe('Quiddo');
            expect($fcmArray['data']['deep_link'])->toBe($expectedDeepLink);

            // Test APNs message
            $apn = $notification->toApn(null);
            expect($apn->body)->toBe($expectedBody);
            expect($apn->title)->toBe('Quiddo');
        });

        it("$name body contains no personal data", function () use ($expectedBody) {
            // Privacy check — no names, amounts, or account details
            expect($expectedBody)->not->toMatch('/\$\d/');
            expect($expectedBody)->not->toMatch('/Emma|Jack|Theodore|Ben/i');
        });
    }
});
