<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFamilyRequest;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\User;
use App\Enums\FamilyRole;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FamilyController extends Controller
{
    public function index()
    {
        return Inertia::render('Families/Index', [
            'families' => auth()->user()->families()->with('users')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Families/Create');
    }

    public function store(StoreFamilyRequest $request)
    {
        $family = Family::create($request->validated());
        FamilyUser::create([
            'family_id' => $family->id,
            'user_id'   => auth()->id(),
            'role'      => FamilyRole::Admin,
        ]);

        return redirect()->route('families.show', $family);
    }

    public function show(Family $family)
    {
        return Inertia::render('Families/Show', [
            'family' => $family->load(['users', 'spenders.accounts']),
        ]);
    }

    public function edit(Family $family)
    {
        return Inertia::render('Families/Edit', [
            'family' => $family,
        ]);
    }

    public function update(StoreFamilyRequest $request, Family $family)
    {
        $family->update($request->validated());

        return redirect()->route('families.show', $family);
    }

    public function destroy(Family $family)
    {
        $family->delete();

        return redirect()->route('families.index');
    }

    public function invite(Request $request, Family $family)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->firstOrFail();
        FamilyUser::firstOrCreate(
            ['family_id' => $family->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Member]
        );

        return redirect()->route('families.show', $family)->with('success', 'User invited successfully.');
    }
}
