<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSavingsGoalRequest;
use App\Models\SavingsGoal;
use Inertia\Inertia;

class SavingsGoalController extends Controller
{
    public function index()
    {
        $user     = auth()->user();
        $spenders = \App\Models\Spender::whereIn('family_id', $user->families()->pluck('families.id'))
            ->with('savingsGoals')
            ->get();

        return Inertia::render('Goals/Index', [
            'spenders' => $spenders,
        ]);
    }

    public function create()
    {
        $user     = auth()->user();
        $spenders = $user->isParent()
            ? \App\Models\Spender::whereIn('family_id', $user->families()->pluck('families.id'))->get()
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
            'goal' => $goal->load('spender'),
        ]);
    }

    public function edit(SavingsGoal $goal)
    {
        return Inertia::render('Goals/Edit', [
            'goal' => $goal,
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
}
