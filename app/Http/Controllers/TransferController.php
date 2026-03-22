<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransferRequest;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    public function create(Account $account): Response
    {
        $accounts = Account::where('spender_id', $account->spender_id)
            ->where('id', '!=', $account->id)
            ->when(
                $account->currency_symbol === null,
                fn ($q) => $q->whereNull('currency_symbol'),
                fn ($q) => $q->where('currency_symbol', $account->currency_symbol)
            )
            ->get();

        return Inertia::render('Transfers/Create', [
            'account' => $account,
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreTransferRequest $request, Account $account): RedirectResponse
    {
        $user = auth()->user();
        $toAccount = Account::findOrFail($request->to_account_id);

        $sourceSpender = $account->spender;
        $destSpender = $toAccount->spender;

        abort_if($sourceSpender === null || $destSpender === null, 404);

        // Must be same spender and same currency
        abort_if(
            $toAccount->spender_id !== $account->spender_id,
            422,
            'Transfers can only be made between accounts belonging to the same kid.'
        );
        abort_if(
            $toAccount->currency_symbol !== $account->currency_symbol,
            422,
            'Transfers can only be made between accounts using the same currency.'
        );

        // Authorise: parent in same family OR child linked to source spender
        $isParent = $user->isParent()
            && $user->families()->where('families.id', $sourceSpender->family_id)->exists();

        $isLinkedChild = ! $user->isParent()
            && $user->spenders()->where('spenders.id', $sourceSpender->id)->exists();

        if (! $isParent && ! $isLinkedChild) {
            abort(403);
        }

        DB::transaction(function () use ($request, $account, $toAccount) {
            $groupId = Str::uuid()->toString();

            $account->transactions()->create([
                'type' => 'debit',
                'amount' => $request->amount,
                'description' => $request->description,
                'transfer_group_id' => $groupId,
                'occurred_at' => now(),
            ]);

            $toAccount->transactions()->create([
                'type' => 'credit',
                'amount' => $request->amount,
                'description' => $request->description,
                'transfer_group_id' => $groupId,
                'occurred_at' => now(),
            ]);

            $account->decrement('balance', $request->amount);
            $toAccount->increment('balance', $request->amount);
        });

        return redirect()->back()->with('success', 'Transfer completed.');
    }
}
