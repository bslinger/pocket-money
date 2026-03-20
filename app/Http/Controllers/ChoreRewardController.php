<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\ChoreReward;
use App\Models\Spender;
use App\Models\Transaction;
use App\Services\SpenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChoreRewardController extends Controller
{
    public function store(Request $request, Spender $spender)
    {
        $data = $request->validate([
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'payout_date' => ['nullable', 'date'],
            'chore_ids'   => ['required', 'array', 'min:1'],
            'chore_ids.*' => ['required', 'uuid'],
        ]);

        $reward = ChoreReward::create([
            'spender_id'  => $spender->id,
            'amount'      => $data['amount'],
            'description' => $data['description'] ?? null,
            'payout_date' => $data['payout_date'] ?? null,
            'created_by'  => $request->user()->id,
        ]);

        $reward->chores()->sync($data['chore_ids']);

        // If no payout date, check immediately if all chores are already done
        if (!$reward->payout_date) {
            $reward->load('chores', 'spender.choreCompletions');
            if ($reward->allChoresCompleted()) {
                $this->pay($reward);
            }
        }

        return back()->with('success', 'Chore reward created.');
    }

    public function destroy(ChoreReward $choreReward)
    {
        $choreReward->delete();
        return back()->with('success', 'Chore reward removed.');
    }

    public static function pay(ChoreReward $reward): void
    {
        DB::transaction(function () use ($reward) {
            $account = SpenderService::mainAccount($reward->spender);
            $transaction = Transaction::create([
                'account_id'  => $account->id,
                'type'        => 'credit',
                'amount'      => $reward->amount,
                'description' => $reward->description ?? 'Chore reward',
                'occurred_at' => now(),
                'created_by'  => $reward->created_by,
            ]);
            $account->increment('balance', (float) $reward->amount);
            $reward->update([
                'is_paid'        => true,
                'paid_at'        => now(),
                'transaction_id' => $transaction->id,
            ]);
        });
    }
}
