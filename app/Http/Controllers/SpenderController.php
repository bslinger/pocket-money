<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpenderRequest;
use App\Models\Spender;
use App\Models\SpenderUser;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SpenderController extends Controller
{
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
        return Inertia::render('Spenders/Edit', [
            'spender' => $spender,
            'family'  => $spender->family,
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
