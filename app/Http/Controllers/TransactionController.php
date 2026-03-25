<?php

namespace App\Http\Controllers;

use App\Enums\TxType;
use App\Http\Requests\StoreSplitTransactionRequest;
use App\Http\Requests\StoreTransactionRequest;
use App\Models\Account;
use App\Models\Transaction;
use App\Services\AnalyticsService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Account $account)
    {
        return Inertia::render('Transactions/Index', [
            'account' => $account,
            'transactions' => $account->transactions()->latest('occurred_at')->paginate(50),
        ]);
    }

    public function create(Account $account)
    {
        return Inertia::render('Transactions/Create', [
            'account' => $account->load('spender.family'),
        ]);
    }

    public function storeSplit(StoreSplitTransactionRequest $request): RedirectResponse
    {
        $user = $request->user();
        $familyIds = $user->families()->pluck('families.id');

        DB::transaction(function () use ($request, $familyIds) {
            foreach ($request->splits as $split) {
                $account = Account::whereHas('spender', fn ($q) => $q->whereIn('family_id', $familyIds))
                    ->findOrFail($split['account_id']);

                $account->transactions()->create([
                    'type' => 'credit',
                    'amount' => $split['amount'],
                    'description' => $request->description,
                    'occurred_at' => $request->occurred_at,
                ]);

                $account->increment('balance', $split['amount']);
            }
        });

        return redirect()->route('dashboard');
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

        rescue(fn () => NotificationService::transactionRecorded($account));
        rescue(fn () => app(AnalyticsService::class)->crudEvent(
            $request->user(), 'transaction', 'created', ['type' => $request->type]
        ));

        return redirect()->route('accounts.show', $account);
    }

    public function edit(Account $account, Transaction $transaction)
    {
        return Inertia::render('Transactions/Edit', [
            'account' => $account,
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

        rescue(fn () => NotificationService::transactionRecorded($account));
        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'transaction', 'updated'));

        return redirect()->route('accounts.show', $account);
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

        rescue(fn () => NotificationService::transactionRecorded($account));
        rescue(fn () => app(AnalyticsService::class)->crudEvent(auth()->user(), 'transaction', 'deleted'));

        return redirect()->route('accounts.show', $account);
    }
}
