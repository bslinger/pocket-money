<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpenderRequest;
use App\Models\Spender;
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
                'savingsGoals',
                'family',
            ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('Spenders/Create', [
            'families' => auth()->user()->families()
                ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
                ->get(),
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
        $spender->delete();

        return redirect()->route('families.show', $spender->family_id);
    }
}
