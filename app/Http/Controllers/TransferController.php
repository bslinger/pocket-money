<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransferRequest;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferController extends Controller
{
    public function create(Account $account)
    {
        $user = auth()->user();
        $accounts = \App\Models\Account::whereHas('spender', function ($q) use ($user) {
            $q->whereIn('family_id', $user->families()->pluck('families.id'));
        })->where('id', '!=', $account->id)->get();

        return \Inertia\Inertia::render('Transfers/Create', [
            'account'  => $account,
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreTransferRequest $request, Account $account)
    {
        $user = auth()->user();
        $toAccount = Account::findOrFail($request->to_account_id);

        // Authorise: parent in same family OR child linked to source spender
        $sourceSpender = $account->spender;
        $destSpender   = $toAccount->spender;

        abort_if($sourceSpender === null || $destSpender === null, 404);

        $isParent = $user->isParent()
            && $user->families()->where('families.id', $sourceSpender->family_id)->exists()
            && $user->families()->where('families.id', $destSpender->family_id)->exists();

        $isLinkedChild = !$user->isParent()
            && $user->spenders()->where('spenders.id', $sourceSpender->id)->exists();

        if (!$isParent && !$isLinkedChild) {
            abort(403);
        }

        DB::transaction(function () use ($request, $account, $toAccount) {
            $groupId = Str::uuid()->toString();

            $account->transactions()->create([
                'type'              => 'debit',
                'amount'            => $request->amount,
                'description'       => $request->description,
                'transfer_group_id' => $groupId,
                'occurred_at'       => now(),
            ]);

            $toAccount->transactions()->create([
                'type'              => 'credit',
                'amount'            => $request->amount,
                'description'       => $request->description,
                'transfer_group_id' => $groupId,
                'occurred_at'       => now(),
            ]);

            $account->decrement('balance', $request->amount);
            $toAccount->increment('balance', $request->amount);
        });

        return redirect()->back()->with('success', 'Transfer completed.');
    }
}
