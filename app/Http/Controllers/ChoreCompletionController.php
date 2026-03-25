<?php

namespace App\Http\Controllers;

use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\Transaction;
use App\Services\AnalyticsService;
use App\Services\NotificationService;
use App\Services\SpenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChoreCompletionController extends Controller
{
    public function store(Request $request, Chore $chore)
    {
        $request->validate([
            'spender_id' => ['required', 'uuid', 'exists:spenders,id'],
        ]);

        $spenderId = $request->input('spender_id');

        // Verify requesting user is allowed to act for this spender.
        // A child user must have a SpenderUser record.
        // A parent in "view as" mode is also allowed (they're previewing as the child).
        $user = $request->user();
        $viewingAsSpenderId = session('viewing_as_spender_id');
        $parentViewingAsThisSpender = $user->isParent()
            && $viewingAsSpenderId === $spenderId
            && $user->families()
                ->whereHas('spenders', fn ($q) => $q->where('spenders.id', $spenderId))
                ->exists();

        if (! $parentViewingAsThisSpender) {
            $linked = $user->spenders()->where('spenders.id', $spenderId)->exists();
            abort_unless($linked, 403);
        }

        // Check up_for_grabs collision: if not up_for_grabs, spender must be assigned
        if (! $chore->up_for_grabs) {
            $assigned = $chore->spenders()->where('spenders.id', $spenderId)->exists();
            abort_unless($assigned, 403);
        }

        // No duplicate pending completions
        $duplicate = ChoreCompletion::where('chore_id', $chore->id)
            ->where('spender_id', $spenderId)
            ->where('status', CompletionStatus::Pending)
            ->exists();

        if ($duplicate) {
            return back()->with('error', 'Already awaiting approval.');
        }

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spenderId,
            'status' => CompletionStatus::Pending,
            'completed_at' => now(),
        ]);

        rescue(fn () => NotificationService::choreSubmittedForApproval($completion));

        return back()->with('success', 'Marked as done! Waiting for approval.');
    }

    public function approve(ChoreCompletion $completion)
    {
        DB::transaction(function () use ($completion) {
            $completion->update([
                'status' => CompletionStatus::Approved,
                'reviewed_at' => now(),
                'reviewed_by' => auth()->id(),
            ]);

            if ($completion->chore->reward_type === ChoreRewardType::Earns) {
                $account = SpenderService::mainAccount($completion->spender);
                $transaction = Transaction::create([
                    'account_id' => $account->id,
                    'type' => 'credit',
                    'amount' => $completion->chore->amount,
                    'description' => 'Chore reward: '.$completion->chore->name,
                    'occurred_at' => now(),
                    'created_by' => auth()->id(),
                ]);
                $account->increment('balance', (float) $completion->chore->amount);
                $completion->update(['transaction_id' => $transaction->id]);
            }
        });

        rescue(fn () => NotificationService::choreApproved($completion));
        rescue(fn () => app(AnalyticsService::class)->choreApproved(
            auth()->user(),
            $completion->chore->reward_type->value,
        ));

        return back()->with('success', 'Chore approved.');
    }

    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['uuid', 'exists:chore_completions,id'],
        ]);

        $completions = ChoreCompletion::with(['chore', 'spender'])
            ->whereIn('id', $request->input('ids'))
            ->where('status', CompletionStatus::Pending)
            ->get();

        DB::transaction(function () use ($completions) {
            foreach ($completions as $completion) {
                /** @var ChoreCompletion $completion */
                $completion->update([
                    'status' => CompletionStatus::Approved,
                    'reviewed_at' => now(),
                    'reviewed_by' => auth()->id(),
                ]);

                if ($completion->chore->reward_type === ChoreRewardType::Earns) {
                    $account = SpenderService::mainAccount($completion->spender);
                    $transaction = Transaction::create([
                        'account_id' => $account->id,
                        'type' => 'credit',
                        'amount' => $completion->chore->amount,
                        'description' => 'Chore reward: '.$completion->chore->name,
                        'occurred_at' => now(),
                        'created_by' => auth()->id(),
                    ]);
                    $account->increment('balance', (float) $completion->chore->amount);
                    $completion->update(['transaction_id' => $transaction->id]);
                }
            }
        });

        rescue(fn () => NotificationService::bulkChoresApproved($completions));

        return back()->with('success', 'All chores approved.');
    }

    public function unapprove(ChoreCompletion $completion)
    {
        abort_unless($completion->status === CompletionStatus::Approved, 422);

        $warning = null;

        DB::transaction(function () use ($completion, &$warning) {
            // Reverse any earned transaction
            if ($completion->transaction_id) {
                $transaction = Transaction::find($completion->transaction_id);
                if ($transaction) {
                    $transaction->account->decrement('balance', (float) $transaction->amount);
                    $transaction->delete();
                }
                $completion->transaction_id = null;
            }

            // Check if unapproving a responsibility chore may affect pocket money
            if ($completion->chore->reward_type === ChoreRewardType::Responsibility) {
                $account = SpenderService::mainAccount($completion->spender);
                $pocketMoneyThisWeek = Transaction::where('account_id', $account->id)
                    ->where('type', 'credit')
                    ->where('description', 'like', '%Pocket money%')
                    ->whereBetween('occurred_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->exists();

                if ($pocketMoneyThisWeek) {
                    $warning = 'Pocket money was already paid this week for '.$completion->spender->name.'. Check if it should be reversed.';
                }
            }

            $completion->update([
                'status' => CompletionStatus::Pending,
                'reviewed_at' => null,
                'reviewed_by' => null,
            ]);
        });

        $flash = 'Approval undone — chore is back to pending.';
        if ($warning) {
            return back()->with('warning', $flash.' '.$warning);
        }

        return back()->with('success', $flash);
    }

    public function decline(ChoreCompletion $completion)
    {
        $request = request();
        $request->validate(['note' => ['nullable', 'string', 'max:255']]);

        $completion->update([
            'status' => CompletionStatus::Declined,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
            'note' => $request->input('note'),
        ]);

        rescue(fn () => NotificationService::choreDeclined($completion));
        rescue(fn () => app(AnalyticsService::class)->choreDeclined(auth()->user()));

        return back()->with('success', 'Chore declined.');
    }
}
