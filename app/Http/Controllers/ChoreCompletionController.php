<?php

namespace App\Http\Controllers;

use App\Enums\CompletionStatus;
use App\Enums\ChoreRewardType;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\Transaction;
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

        // Verify requesting user is linked to this spender
        $linked = $request->user()->spenders()->where('spenders.id', $spenderId)->exists();
        abort_unless($linked, 403);

        // Check up_for_grabs collision: if not up_for_grabs, spender must be assigned
        if (!$chore->up_for_grabs) {
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

        ChoreCompletion::create([
            'chore_id'     => $chore->id,
            'spender_id'   => $spenderId,
            'status'       => CompletionStatus::Pending,
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Marked as done! Waiting for approval.');
    }

    public function approve(ChoreCompletion $completion)
    {
        DB::transaction(function () use ($completion) {
            $completion->update([
                'status'      => CompletionStatus::Approved,
                'reviewed_at' => now(),
                'reviewed_by' => auth()->id(),
            ]);

            if ($completion->chore->reward_type === ChoreRewardType::Earns) {
                $account = SpenderService::mainAccount($completion->spender);
                $transaction = Transaction::create([
                    'account_id'  => $account->id,
                    'type'        => 'credit',
                    'amount'      => $completion->chore->amount,
                    'description' => 'Chore reward: ' . $completion->chore->name,
                    'occurred_at' => now(),
                    'created_by'  => auth()->id(),
                ]);
                $account->increment('balance', $completion->chore->amount);
                $completion->update(['transaction_id' => $transaction->id]);
            }
        });

        return back()->with('success', 'Chore approved.');
    }

    public function decline(ChoreCompletion $completion)
    {
        $request = request();
        $request->validate(['note' => ['nullable', 'string', 'max:255']]);

        $completion->update([
            'status'      => CompletionStatus::Declined,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
            'note'        => $request->input('note'),
        ]);

        return back()->with('success', 'Chore declined.');
    }
}
