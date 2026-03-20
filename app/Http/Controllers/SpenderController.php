<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpenderRequest;
use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Models\SpenderUser;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

class SpenderController extends Controller
{
    public function index(Request $request)
    {
        $family = $request->user()->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->first();

        if (!$family) {
            return redirect()->route('families.create');
        }

        $today = Carbon::today();

        $spenders = $family->spenders()
            ->with(['accounts', 'savingsGoals.account'])
            ->withCount(['choreCompletions as today_completions_count' => function ($q) use ($today) {
                $q->whereDate('completed_at', $today);
            }])
            ->orderBy('name')
            ->get()
            ->map(function (Spender $spender) {
                $spender->setAttribute('total_balance', $spender->accounts->sum('balance'));
                $closestGoal = $spender->savingsGoals
                    ->where('is_completed', false)
                    ->map(function ($goal) {
                        /** @var \App\Models\SavingsGoal $goal */
                        $account = $goal->account instanceof \App\Models\Account ? $goal->account : null;
                        $current = $account !== null ? (float) $account->balance : 0.0;
                        $target  = max((float) $goal->target_amount, 0.01);
                        return ['goal' => $goal, 'pct' => $current / $target];
                    })
                    ->sortByDesc('pct')
                    ->first()['goal'] ?? null;
                $spender->setRelation('closest_goal', $closestGoal);
                return $spender;
            });

        return Inertia::render('Spenders/Index', [
            'family'   => $family,
            'spenders' => $spenders,
        ]);
    }

    public function show(Spender $spender)
    {
        $user = auth()->user();

        $isParentInFamily = $user->isParent()
            && $user->families()->where('families.id', $spender->family_id)->exists();
        $isLinkedChild = !$user->isParent()
            && $user->spenders()->where('spenders.id', $spender->id)->exists();

        if (!$isParentInFamily && !$isLinkedChild) {
            abort(403);
        }

        return Inertia::render('Spenders/Show', [
            'spender' => $spender->load([
                'accounts.transactions' => fn($q) => $q->latest('occurred_at')->limit(20),
                'savingsGoals.account',
                'family',
                'users',
            ]),
        ]);
    }

    public function linkChild(Request $request, Spender $spender)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors(['email' => 'No user found with that email address.']);
        }

        SpenderUser::firstOrCreate([
            'spender_id' => $spender->id,
            'user_id'    => $user->id,
        ]);

        return back()->with('success', 'Child account linked.');
    }

    public function unlinkChild(Spender $spender, User $user)
    {
        SpenderUser::where('spender_id', $spender->id)
            ->where('user_id', $user->id)
            ->delete();

        return back();
    }

    public function create()
    {
        $families = auth()->user()->families()
            ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
            ->get();

        return Inertia::render('Spenders/Create', [
            'families' => $families,
        ]);
    }

    public function store(StoreSpenderRequest $request)
    {
        $spender = Spender::create($request->validated());

        return redirect()->route('spenders.show', $spender);
    }

    public function edit(Spender $spender)
    {
        $schedule = PocketMoneySchedule::where('spender_id', $spender->id)
            ->where('is_active', true)
            ->first();

        $choreRewards = $spender->choreRewards()
            ->with('chores')
            ->where('is_paid', false)
            ->orderBy('created_at')
            ->get();

        return Inertia::render('Spenders/Edit', [
            'spender'             => $spender,
            'family'              => $spender->family,
            'pocketMoneySchedule' => $schedule,
            'choreRewards'        => $choreRewards,
            'availableChores'     => $spender->chores()->where('is_active', true)->get(),
        ]);
    }

    public function update(StoreSpenderRequest $request, Spender $spender)
    {
        $spender->update($request->validated());

        return redirect()->route('spenders.show', $spender);
    }

    public function destroy(Spender $spender)
    {
        $familyId = $spender->family_id;
        $spender->delete(); // soft-delete (archive)

        return redirect()->route('families.show', $familyId);
    }

    public function restore(string $id)
    {
        $spender = Spender::withTrashed()->findOrFail($id);
        $spender->restore();

        return redirect()->route('families.show', $spender->family_id);
    }
}
