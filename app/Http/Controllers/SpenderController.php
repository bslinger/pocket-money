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
            ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('Spenders/Create', [
            'families' => auth()->user()->families()->get(),
        ]);
    }

    public function store(StoreSpenderRequest $request)
    {
        $request->validate(['family_id' => 'required|uuid|exists:families,id']);

        $spender = Spender::create(array_merge(
            $request->validated(),
            ['family_id' => $request->family_id]
        ));

        return redirect()->route('spenders.show', $spender);
    }

    public function edit(Spender $spender)
    {
        return Inertia::render('Spenders/Edit', [
            'spender' => $spender,
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
