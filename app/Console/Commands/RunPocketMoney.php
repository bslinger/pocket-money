<?php

namespace App\Console\Commands;

use App\Enums\CompletionStatus;
use App\Models\PocketMoneySchedule;
use App\Models\Transaction;
use App\Services\AnalyticsService;
use App\Services\NotificationService;
use App\Services\SpenderService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RunPocketMoney extends Command
{
    protected $signature = 'pocket-money:run';

    protected $description = 'Pay out scheduled pocket money for eligible spenders';

    public function handle(): void
    {
        $due = PocketMoneySchedule::query()
            ->where('is_active', true)
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', now())
            ->with(['spender.chores', 'spender.choreCompletions', 'spender.accounts', 'account', 'splits.account'])
            ->get();

        $this->info("Processing {$due->count()} due pocket money schedules...");

        foreach ($due as $schedule) {
            /** @var PocketMoneySchedule $schedule */
            $spender = $schedule->spender;

            $paid = $this->checkAndPay($schedule);
            $status = $paid ? 'paid' : 'skipped (responsibilities not met)';
            $this->line("  - {$spender->name}: {$status}");

            // Advance next_run_at regardless
            $schedule->next_run_at = $this->advanceDate($schedule);
            $schedule->save();
        }

        $this->info('Done.');
    }

    private function checkAndPay(PocketMoneySchedule $schedule): bool
    {
        $spender = $schedule->spender;

        // Check all active responsibility chores for this spender
        $responsibilityChores = $spender->chores
            ->where('reward_type', 'responsibility')
            ->where('is_active', true);

        if ($responsibilityChores->isNotEmpty()) {
            $weekStart = now()->startOfWeek();
            $weekEnd = now()->endOfWeek();

            $completedChoreIds = $spender->choreCompletions
                ->where('status', CompletionStatus::Approved->value)
                ->whereBetween('completed_at', [$weekStart, $weekEnd])
                ->pluck('chore_id')
                ->unique();

            $requiredChoreIds = $responsibilityChores->pluck('id');
            $allMet = $requiredChoreIds->every(
                fn (string $id) => $completedChoreIds->contains($id)
            );

            if (! $allMet) {
                return false;
            }
        }

        DB::transaction(function () use ($schedule, $spender) {
            $splits = $schedule->splits;

            if ($splits->isNotEmpty()) {
                $total = (float) $schedule->amount;
                $remaining = $total;
                $lastIndex = $splits->count() - 1;

                foreach ($splits as $i => $split) {
                    $amt = $i === $lastIndex
                        ? round($remaining, 2)
                        : round($total * (float) $split->percentage / 100, 2);

                    $remaining -= $amt;

                    Transaction::create([
                        'account_id' => $split->account_id,
                        'type' => 'credit',
                        'amount' => $amt,
                        'description' => 'Pocket money',
                        'occurred_at' => now(),
                        'created_by' => $schedule->created_by,
                    ]);

                    $split->account->increment('balance', $amt);
                }
            } else {
                $account = $schedule->account ?? SpenderService::mainAccount($spender);
                Transaction::create([
                    'account_id' => $account->id,
                    'type' => 'credit',
                    'amount' => $schedule->amount,
                    'description' => 'Pocket money',
                    'occurred_at' => now(),
                    'created_by' => $schedule->created_by,
                ]);
                $account->increment('balance', (float) $schedule->amount);
            }
        });

        rescue(fn () => NotificationService::pocketMoneyPaid($spender));
        rescue(fn () => app(AnalyticsService::class)->pocketMoneyReleased(
            (string) $schedule->created_by,
            1,
        ));

        return true;
    }

    private function advanceDate(PocketMoneySchedule $schedule): Carbon
    {
        $from = $schedule->next_run_at ?? now();

        if ($schedule->frequency === 'weekly') {
            return $from->copy()->addWeek();
        }

        // monthly: same day next month
        $target = $schedule->day_of_month ?? 1;
        $next = $from->copy()->addMonth();

        return $next->setDay(min($target, $next->daysInMonth))->startOfDay();
    }
}
