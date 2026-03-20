<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Models\Account;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function show(Account $account)
    {
        return Inertia::render('Accounts/Show', [
            'account' => $account->load([
                'transactions' => fn($q) => $q->latest('occurred_at')->limit(50),
                'spender.family',
            ]),
        ]);
    }

    public function create(\Illuminate\Http\Request $request)
    {
        $user = auth()->user();
        $spenders = $user->isParent()
            ? \App\Models\Spender::whereIn('family_id', $user->families()->pluck('families.id'))->get()
            : $user->spenders()->get();

        return Inertia::render('Accounts/Create', [
            'spenders'              => $spenders,
            'preselectedSpenderId'  => $request->query('spender_id'),
        ]);
    }

    public function store(StoreAccountRequest $request)
    {
        $request->validate(['spender_id' => 'required|uuid|exists:spenders,id']);

        $account = Account::create(array_merge(
            $request->validated(),
            ['spender_id' => $request->spender_id, 'balance' => 0]
        ));

        return redirect()->route('accounts.show', $account);
    }

    public function edit(Account $account)
    {
        return Inertia::render('Accounts/Edit', [
            'account' => $account,
        ]);
    }

    public function update(StoreAccountRequest $request, Account $account)
    {
        $account->update($request->validated());

        return redirect()->route('accounts.show', $account);
    }

    public function destroy(Account $account)
    {
        $spenderId = $account->spender_id;
        $account->delete();

        return redirect()->route('spenders.show', $spenderId);
    }
}
