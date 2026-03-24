<?php

namespace App\Services;

use App\Models\Account;
use App\Models\ChoreCompletion;
use App\Models\ChoreReward;
use App\Models\Family;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Models\User;
use App\Notifications\BulkChoresApproved;
use App\Notifications\ChildAccountLinked;
use App\Notifications\ChoreApproved;
use App\Notifications\ChoreDeclined;
use App\Notifications\ChoreRewardUnlocked;
use App\Notifications\ChoreSubmittedForApproval;
use App\Notifications\FamilyMemberJoined;
use App\Notifications\PocketMoneyReceived;
use App\Notifications\SavingsGoalReached;
use App\Notifications\TransactionRecorded;
use Illuminate\Support\Collection;

class NotificationService
{
    public static function choreSubmittedForApproval(ChoreCompletion $completion): void
    {
        /** @var Spender $spender */
        $spender = $completion->spender;

        /** @var Family $family */
        $family = $spender->family;

        self::notifyFamilyParents($family, new ChoreSubmittedForApproval);
        BroadcastService::familyUpdated($family);
    }

    public static function choreApproved(ChoreCompletion $completion): void
    {
        /** @var Spender $spender */
        $spender = $completion->spender;
        $spender->notify(new ChoreApproved);

        /** @var Family $family */
        $family = $spender->family;
        BroadcastService::spenderUpdated($spender);
        BroadcastService::familyUpdated($family);
    }

    public static function choreDeclined(ChoreCompletion $completion): void
    {
        /** @var Spender $spender */
        $spender = $completion->spender;
        $spender->notify(new ChoreDeclined);

        /** @var Family $family */
        $family = $spender->family;
        BroadcastService::spenderUpdated($spender);
        BroadcastService::familyUpdated($family);
    }

    /**
     * @param  Collection<int, ChoreCompletion>  $completions
     */
    public static function bulkChoresApproved(Collection $completions): void
    {
        $spenderIds = $completions->pluck('spender_id')->unique();

        /** @var Family|null $family */
        $family = null;

        Spender::whereIn('id', $spenderIds)->with('family')->get()->each(function (Spender $spender) use (&$family): void {
            $spender->notify(new BulkChoresApproved);
            BroadcastService::spenderUpdated($spender);

            /** @var Family $f */
            $f = $spender->family;
            $family = $f;
        });

        if ($family instanceof Family) {
            BroadcastService::familyUpdated($family);
        }
    }

    public static function pocketMoneyPaid(Spender $spender): void
    {
        $spender->notify(new PocketMoneyReceived);

        /** @var Family $family */
        $family = $spender->family;
        BroadcastService::spenderUpdated($spender);
        BroadcastService::familyUpdated($family);
    }

    public static function choreRewardUnlocked(ChoreReward $reward): void
    {
        /** @var Spender $spender */
        $spender = $reward->spender;
        $spender->notify(new ChoreRewardUnlocked);

        /** @var Family $family */
        $family = $spender->family;
        BroadcastService::spenderUpdated($spender);
        BroadcastService::familyUpdated($family);
    }

    public static function savingsGoalReached(SavingsGoal $goal): void
    {
        /** @var Spender $spender */
        $spender = $goal->spender;
        $spender->notify(new SavingsGoalReached);

        /** @var Family $family */
        $family = $spender->family;
        self::notifyFamilyParents($family, new SavingsGoalReached);
        BroadcastService::spenderUpdated($spender);
        BroadcastService::familyUpdated($family);
    }

    public static function familyMemberJoined(Family $family): void
    {
        self::notifyFamilyParents($family, new FamilyMemberJoined);
        BroadcastService::familyUpdated($family);
    }

    public static function childAccountLinked(Spender $spender): void
    {
        /** @var Family $family */
        $family = $spender->family;
        self::notifyFamilyParents($family, new ChildAccountLinked);
        BroadcastService::familyUpdated($family);
    }

    /**
     * Notify the child that a transaction occurred and broadcast to family + spender.
     */
    public static function transactionRecorded(Account $account): void
    {
        /** @var Spender $spender */
        $spender = $account->spender;
        $spender->notify(new TransactionRecorded);

        /** @var Family $family */
        $family = $spender->family;
        BroadcastService::spenderUpdated($spender);
        BroadcastService::familyUpdated($family);
    }

    private static function notifyFamilyParents(Family $family, mixed $notification): void
    {
        /** @phpstan-ignore argument.type */
        $family->users()->get()->each(function (User $user) use ($notification): void {
            $user->notify($notification);
        });
    }
}
