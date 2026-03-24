<?php

namespace App\Services;

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
    }

    public static function choreApproved(ChoreCompletion $completion): void
    {
        /** @var Spender $spender */
        $spender = $completion->spender;
        $spender->notify(new ChoreApproved);
    }

    public static function choreDeclined(ChoreCompletion $completion): void
    {
        /** @var Spender $spender */
        $spender = $completion->spender;
        $spender->notify(new ChoreDeclined);
    }

    /**
     * @param  Collection<int, ChoreCompletion>  $completions
     */
    public static function bulkChoresApproved(Collection $completions): void
    {
        $spenderIds = $completions->pluck('spender_id')->unique();

        Spender::whereIn('id', $spenderIds)->get()->each(function (Spender $spender): void {
            $spender->notify(new BulkChoresApproved);
        });
    }

    public static function pocketMoneyPaid(Spender $spender): void
    {
        $spender->notify(new PocketMoneyReceived);
    }

    public static function choreRewardUnlocked(ChoreReward $reward): void
    {
        /** @var Spender $spender */
        $spender = $reward->spender;
        $spender->notify(new ChoreRewardUnlocked);
    }

    public static function savingsGoalReached(SavingsGoal $goal): void
    {
        /** @var Spender $spender */
        $spender = $goal->spender;
        $spender->notify(new SavingsGoalReached);

        /** @var Family $family */
        $family = $spender->family;
        self::notifyFamilyParents($family, new SavingsGoalReached);
    }

    public static function familyMemberJoined(Family $family): void
    {
        self::notifyFamilyParents($family, new FamilyMemberJoined);
    }

    public static function childAccountLinked(Spender $spender): void
    {
        /** @var Family $family */
        $family = $spender->family;
        self::notifyFamilyParents($family, new ChildAccountLinked);
    }

    private static function notifyFamilyParents(Family $family, mixed $notification): void
    {
        /** @phpstan-ignore argument.type */
        $family->users()->get()->each(function (User $user) use ($notification): void {
            $user->notify($notification);
        });
    }
}
