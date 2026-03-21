<?php

namespace App\Console\Commands;

use App\Http\Controllers\ChoreRewardController;
use App\Models\ChoreReward;
use Illuminate\Console\Command;

class RunChoreRewards extends Command
{
    protected $signature = 'chore-rewards:run';
    protected $description = 'Pay out chore rewards whose payout date has arrived and all required chores are complete';

    public function handle(): void
    {
        $due = ChoreReward::query()
            ->where('is_paid', false)
            ->whereNotNull('payout_date')
            ->where('payout_date', '<=', now()->toDateString())
            ->with(['chores', 'spender.choreCompletions', 'spender.accounts', 'account'])
            ->get();

        $this->info("Processing {$due->count()} due chore rewards...");

        foreach ($due as $reward) {
            /** @var ChoreReward $reward */
            if ($reward->allChoresCompleted()) {
                ChoreRewardController::pay($reward);
                $this->line("  - Paid: {$reward->description} for {$reward->spender->name}");
            } else {
                $this->line("  - Skipped (chores not complete): {$reward->description} for {$reward->spender->name}");
            }
        }

        $this->info('Done.');
    }
}
