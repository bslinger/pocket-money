<?php

namespace App\Services;

use App\Models\PocketMoneyEvent;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CatchupService
{
    /**
     * Build the catch-up summary for a user: pocket money events and goals met
     * since the user's last_catchup_at timestamp.
     *
     * @return array{has_events: bool, spenders: list<array<string, mixed>>}
     */
    public function buildForUser(User $user): array
    {
        if ($user->last_catchup_at === null) {
            return ['has_events' => false, 'spenders' => []];
        }

        $since = $user->last_catchup_at;

        $familyIds = $user->families()->pluck('families.id');

        if ($familyIds->isEmpty()) {
            return ['has_events' => false, 'spenders' => []];
        }

        $spenders = Spender::whereIn('family_id', $familyIds)
            ->whereNull('deleted_at')
            ->get();

        $spenderIds = $spenders->pluck('id');

        // Pocket money events since last catchup
        $events = PocketMoneyEvent::whereIn('spender_id', $spenderIds)
            ->where('created_at', '>', $since)
            ->orderBy('scheduled_for')
            ->get();

        // Goals met since last catchup
        $goals = SavingsGoal::whereIn('spender_id', $spenderIds)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>', $since)
            ->get();

        $summaries = [];

        foreach ($spenders as $spender) {
            $spenderEvents = $events->where('spender_id', $spender->id)->values();
            $spenderGoals = $goals->where('spender_id', $spender->id)->values();

            if ($spenderEvents->isEmpty() && $spenderGoals->isEmpty()) {
                continue;
            }

            $summaries[] = [
                'spender' => [
                    'id' => $spender->id,
                    'name' => $spender->name,
                    'color' => $spender->color,
                    'avatar_url' => $spender->getAttributeValue('avatar_url'),
                    'currency_symbol' => $spender->currency_symbol,
                    'use_integer_amounts' => $spender->use_integer_amounts,
                ],
                'pocket_money_events' => $spenderEvents->map(
                    /** @return array<string, mixed> */
                    fn (PocketMoneyEvent $e) => [
                        'id' => $e->id,
                        'scheduled_for' => $e->scheduled_for->toDateString(),
                        'amount' => (string) $e->amount,
                        'status' => $e->status,
                        'transaction_id' => $e->transaction_id,
                    ]
                )->values()->all(),
                'goals_met' => $spenderGoals->map(
                    /** @return array<string, mixed> */
                    fn (SavingsGoal $g) => [
                        'id' => $g->id,
                        'name' => $g->name,
                        'target_amount' => (string) $g->target_amount,
                        'completed_at' => $g->completed_at,
                    ]
                )->values()->all(),
            ];
        }

        return [
            'has_events' => ! empty($summaries),
            'spenders' => $summaries,
        ];
    }

    /**
     * Release a withheld pocket money event: create a backdated credit transaction.
     */
    public function release(PocketMoneyEvent $event, User $actor): PocketMoneyEvent
    {
        abort_if($event->status === 'released', 422, 'Already released.');

        DB::transaction(function () use ($event, $actor) {
            $spender = $event->spender()->with('accounts')->first();
            $account = SpenderService::mainAccount($spender);

            $note = 'Pocket money (catch-up: '.$event->scheduled_for->format('j M Y').')';

            $tx = Transaction::create([
                'account_id' => $account->id,
                'type' => 'credit',
                'amount' => $event->amount,
                'description' => $note,
                'occurred_at' => Carbon::parse($event->scheduled_for)->midDay(),
                'created_by' => $actor->id,
            ]);

            $account->increment('balance', (float) $event->amount);

            $event->update(['status' => 'released', 'transaction_id' => $tx->id]);
        });

        return $event->refresh();
    }

    /**
     * Reverse a released pocket money event: create an offsetting debit transaction.
     */
    public function reverse(PocketMoneyEvent $event, User $actor): PocketMoneyEvent
    {
        abort_if($event->status === 'withheld', 422, 'Not released — nothing to reverse.');

        DB::transaction(function () use ($event, $actor) {
            $spender = $event->spender()->with('accounts')->first();
            $account = SpenderService::mainAccount($spender);

            $note = 'Pocket money reversed (catch-up: '.$event->scheduled_for->format('j M Y').')';

            Transaction::create([
                'account_id' => $account->id,
                'type' => 'debit',
                'amount' => $event->amount,
                'description' => $note,
                'occurred_at' => now(),
                'created_by' => $actor->id,
            ]);

            $account->decrement('balance', (float) $event->amount);

            $event->update(['status' => 'withheld', 'transaction_id' => null]);
        });

        return $event->refresh();
    }
}
