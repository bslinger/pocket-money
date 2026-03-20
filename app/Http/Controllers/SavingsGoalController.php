<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSavingsGoalRequest;
use App\Models\SavingsGoal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SavingsGoalController extends Controller
{
    public function index()
    {
        $user     = auth()->user();
        $spenders = \App\Models\Spender::whereIn('family_id',
                $user->families()
                    ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
                    ->pluck('families.id')
            )
            ->with(['savingsGoals', 'family'])
            ->get();

        return Inertia::render('Goals/Index', [
            'spenders' => $spenders,
        ]);
    }

    public function create()
    {
        $user     = auth()->user();
        $spenders = $user->isParent()
            ? \App\Models\Spender::whereIn('family_id',
                $user->families()
                    ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
                    ->pluck('families.id')
              )->get()
            : $user->spenders()->get();
        $accounts = \App\Models\Account::whereIn('spender_id', $spenders->pluck('id'))->get();

        return Inertia::render('Goals/Create', [
            'spenders' => $spenders,
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreSavingsGoalRequest $request)
    {
        $request->validate(['spender_id' => 'required|uuid|exists:spenders,id']);

        SavingsGoal::create(array_merge(
            $request->validated(),
            ['spender_id' => $request->spender_id]
        ));

        return redirect()->route('goals.index');
    }

    public function show(SavingsGoal $goal)
    {
        return Inertia::render('Goals/Show', [
            'goal' => $goal->load(['spender.family', 'account']),
        ]);
    }

    public function edit(SavingsGoal $goal)
    {
        $goal->load('spender');
        $accounts = \App\Models\Account::where('spender_id', $goal->spender_id)->get();

        return Inertia::render('Goals/Edit', [
            'goal'     => $goal,
            'accounts' => $accounts,
        ]);
    }

    public function syncFromAccount(SavingsGoal $goal)
    {
        abort_unless($goal->account_id !== null, 422, 'No account linked to this goal.');

        /** @var \App\Models\Account $account */
        $account = $goal->account;
        $balance = $account->balance;
        $goal->update(['current_amount' => $balance]);

        if (!$goal->is_completed && $goal->current_amount >= $goal->target_amount) {
            $goal->update(['is_completed' => true]);
        }

        return back()->with('success', 'Goal synced from account balance.');
    }

    public function contribute(Request $request, SavingsGoal $goal)
    {
        $request->validate(['amount' => 'required|numeric|min:0.01']);

        $goal->increment('current_amount', $request->amount);
        $goal->refresh();

        if (!$goal->is_completed && $goal->current_amount >= $goal->target_amount) {
            $goal->update(['is_completed' => true]);
        }

        return back()->with('success', 'Contribution added!');
    }

    public function update(StoreSavingsGoalRequest $request, SavingsGoal $goal)
    {
        $goal->update($request->validated());

        return redirect()->route('goals.show', $goal);
    }

    public function destroy(SavingsGoal $goal)
    {
        $goal->delete();

        return redirect()->route('goals.index');
    }
}
