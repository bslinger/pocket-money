<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Models\Account;
use App\Models\Spender;
use App\Services\AnalyticsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function show(Account $account)
    {
        return Inertia::render('Accounts/Show', [
            'account' => $account->load([
                'transactions' => fn ($q) => $q->latest('occurred_at')->limit(50),
                'spender.family',
            ]),
        ]);
    }

    public function create(Request $request)
    {
        $user = auth()->user();
        $spenders = $user->isParent()
            ? Spender::whereIn('family_id', $user->families()->pluck('families.id'))->get()
            : $user->spenders()->get();

        $family = $user->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->first();

        return Inertia::render('Accounts/Create', [
            'spenders' => $spenders,
            'preselectedSpenderId' => $request->query('spender_id'),
            'family' => $family,
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        $request->validate(['spender_id' => 'required|uuid|exists:spenders,id']);

        $account = Account::create(array_merge(
            $request->validated(),
            ['spender_id' => $request->spender_id, 'balance' => 0]
        ));

        Inertia::clearHistory();

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'account', 'created'));

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

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'account', 'updated'));

        return redirect()->route('accounts.show', $account);
    }

    public function destroy(Account $account)
    {
        $spenderId = $account->spender_id;
        $account->delete();

        rescue(fn () => app(AnalyticsService::class)->crudEvent(auth()->user(), 'account', 'deleted'));

        return redirect()->route('spenders.show', $spenderId);
    }
}
