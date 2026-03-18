<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRecurringTransactionRequest;
use App\Models\Account;
use App\Models\RecurringTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecurringTransactionController extends Controller
{
    public function index(Account $account)
    {
        return Inertia::render('Recurring/Index', [
            'account'    => $account,
            'recurrings' => $account->recurringTransactions()->get(),
        ]);
    }

    public function create(Account $account)
    {
        return Inertia::render('Recurring/Create', [
            'account' => $account,
        ]);
    }

    public function store(StoreRecurringTransactionRequest $request, Account $account)
    {
        $account->recurringTransactions()->create($request->validated());

        return redirect()->route('accounts.recurring.index', $account);
    }

    public function edit(Account $account, RecurringTransaction $recurring)
    {
        return Inertia::render('Recurring/Edit', [
            'account'   => $account,
            'recurring' => $recurring,
        ]);
    }

    public function update(Request $request, Account $account, RecurringTransaction $recurring)
    {
        $validated = $request->validate([
            'type'             => 'required|in:credit,debit',
            'amount'           => 'required|numeric|min:0.01',
            'description'      => 'nullable|string|max:255',
            'frequency'        => 'required|in:daily,weekly,fortnightly,monthly,yearly',
            'frequency_config' => 'nullable|array',
            'next_run_at'      => 'required|date',
        ]);

        $recurring->update($validated);

        return redirect()->route('accounts.recurring.index', $account);
    }

    public function destroy(Account $account, RecurringTransaction $recurring)
    {
        $recurring->delete();

        return redirect()->route('accounts.recurring.index', $account);
    }
}
