<?php

namespace App\Http\Controllers;

use App\Enums\TxType;
use App\Http\Requests\StoreTransactionRequest;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Account $account)
    {
        return Inertia::render('Transactions/Index', [
            'account'      => $account,
            'transactions' => $account->transactions()->latest('occurred_at')->paginate(50),
        ]);
    }

    public function create(Account $account)
    {
        return Inertia::render('Transactions/Create', [
            'account' => $account,
        ]);
    }

    public function store(StoreTransactionRequest $request, Account $account)
    {
        DB::transaction(function () use ($request, $account) {
            $account->transactions()->create($request->validated());

            if ($request->type === 'credit') {
                $account->increment('balance', $request->amount);
            } else {
                $account->decrement('balance', $request->amount);
            }
        });

        return redirect()->route('accounts.transactions.index', $account);
    }

    public function edit(Account $account, Transaction $transaction)
    {
        return Inertia::render('Transactions/Edit', [
            'account'     => $account,
            'transaction' => $transaction,
        ]);
    }

    public function update(StoreTransactionRequest $request, Account $account, Transaction $transaction)
    {
        DB::transaction(function () use ($request, $account, $transaction) {
            // Revert old balance change
            if ($transaction->type === TxType::Credit) {
                $account->decrement('balance', $transaction->amount);
            } else {
                $account->increment('balance', $transaction->amount);
            }

            // Apply new balance change
            if ($request->type === 'credit') {
                $account->increment('balance', $request->amount);
            } else {
                $account->decrement('balance', $request->amount);
            }

            $transaction->update($request->validated());
        });

        return redirect()->route('accounts.transactions.index', $account);
    }

    public function destroy(Account $account, Transaction $transaction)
    {
        DB::transaction(function () use ($account, $transaction) {
            // Revert balance change
            if ($transaction->type === TxType::Credit) {
                $account->decrement('balance', $transaction->amount);
            } else {
                $account->increment('balance', $transaction->amount);
            }

            $transaction->delete();
        });

        return redirect()->route('accounts.transactions.index', $account);
    }
}
