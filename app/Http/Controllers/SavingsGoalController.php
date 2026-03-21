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
            ->with(['savingsGoals' => fn($q) => $q->orderBy('sort_order'), 'savingsGoals.account', 'family'])
            ->get();

        // Compute cascade allocations per account
        foreach ($spenders as $spender) {
            SavingsGoal::applyAccountAllocations($spender->savingsGoals);
        }

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

        // Place the new goal at the end of the account's list
        $maxOrder = SavingsGoal::where('account_id', $request->account_id)->max('sort_order') ?? -1;

        SavingsGoal::create(array_merge(
            $request->validated(),
            ['spender_id' => $request->spender_id, 'sort_order' => $maxOrder + 1]
        ));

        return redirect()->route('goals.index');
    }

    public function show(SavingsGoal $goal)
    {
        $goal->load(['spender.family', 'account']);

        if ($goal->account !== null) {
            $siblingsInOrder = SavingsGoal::where('account_id', $goal->account_id)
                ->orderBy('sort_order')
                ->get();
            SavingsGoal::computeAllocations($siblingsInOrder, (float) $goal->account->balance);
            $sibling = $siblingsInOrder->firstWhere('id', $goal->id);
            $goal->setAttribute('allocated_amount', $sibling instanceof SavingsGoal ? $sibling->allocated_amount : '0.00');
        }

        return Inertia::render('Goals/Show', [
            'goal' => $goal,
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

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'goal_ids'   => 'required|array|min:1',
            'goal_ids.*' => 'uuid|exists:savings_goals,id',
        ]);

        foreach ($validated['goal_ids'] as $index => $goalId) {
            SavingsGoal::where('id', $goalId)->update(['sort_order' => $index]);
        }

        return back();
    }
}
