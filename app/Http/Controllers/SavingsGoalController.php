<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSavingsGoalRequest;
use App\Models\SavingsGoal;
use Bentonow\BentoLaravel\DataTransferObjects\EventData;
use Bentonow\BentoLaravel\Facades\Bento;
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
            ->with([
                'savingsGoals' => fn($q) => $q
                    ->whereNull('abandoned_at')
                    ->orderBy('sort_order'),
                'savingsGoals.account',
                'family',
            ])
            ->get();

        // Compute cascade allocations per account
        foreach ($spenders as $spender) {
            SavingsGoal::applyAccountAllocations($spender->savingsGoals);
        }

        $recentlyCompleted = now()->subWeek();

        return Inertia::render('Goals/Index', [
            'spenders' => $spenders,
            'recentCompletedCutoff' => $recentlyCompleted->toIso8601String(),
        ]);
    }

    public function abandoned()
    {
        $user     = auth()->user();
        $spenders = \App\Models\Spender::whereIn('family_id',
                $user->families()
                    ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
                    ->pluck('families.id')
            )
            ->with([
                'savingsGoals' => fn($q) => $q
                    ->whereNotNull('abandoned_at')
                    ->orderByDesc('abandoned_at'),
                'family',
            ])
            ->get()
            ->filter(fn($s) => $s->savingsGoals->isNotEmpty())
            ->values();

        if ($spenders->isEmpty()) {
            return redirect()->route('goals.index');
        }

        return Inertia::render('Goals/Abandoned', [
            'spenders' => $spenders,
        ]);
    }

    public function abandon(Request $request, SavingsGoal $goal)
    {
        if ($goal->abandoned_at !== null) {
            return back();
        }

        // Get the current allocated amount before abandoning
        $allocatedAmount = $goal->allocated_amount;
        if ($goal->account !== null) {
            $siblings = SavingsGoal::where('account_id', $goal->account_id)
                ->whereNull('abandoned_at')
                ->orderBy('sort_order')
                ->get();
            SavingsGoal::applyAccountAllocations($siblings);
            $sibling = $siblings->firstWhere('id', $goal->id);
            $allocatedAmount = $sibling instanceof SavingsGoal ? $sibling->allocated_amount : '0.00';
        }

        // Goals created in the past 24 hours: hard delete
        if ($goal->created_at !== null && $goal->created_at->gt(now()->subDay())) {
            $goal->delete();
            return redirect()->route('goals.index');
        }

        // Otherwise: mark as abandoned
        $goal->update([
            'abandoned_at'               => now(),
            'abandoned_allocated_amount' => $allocatedAmount,
        ]);

        return redirect()->route('goals.index');
    }

    public function destroyAbandoned(SavingsGoal $goal)
    {
        abort_unless($goal->abandoned_at !== null, 403);
        $goal->delete();
        return redirect()->route('goals.abandoned');
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

        $goal = SavingsGoal::create(array_merge(
            $request->validated(),
            ['spender_id' => $request->spender_id, 'sort_order' => $maxOrder + 1]
        ));

        rescue(function () use ($request, $goal): void {
            Bento::trackEvent(collect([
                new EventData(
                    type: '$created_goal',
                    email: $request->user()->email,
                    fields: [
                        'goal_name'     => $goal->name,
                        'target_amount' => $goal->target_amount,
                    ],
                ),
            ]));
        });

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
