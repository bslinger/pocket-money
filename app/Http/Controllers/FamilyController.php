<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFamilyRequest;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\User;
use App\Enums\FamilyRole;
use Illuminate\Http\RedirectResponse;
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
            'family'        => $family->load(['familyUsers.user', 'spenders.accounts']),
            'authUserId'    => auth()->id(),
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

        return back()->with('success', 'User invited successfully.');
    }

    public function switchActive(Family $family): RedirectResponse
    {
        session(['active_family_id' => $family->id]);

        return redirect()->route('dashboard');
    }

    public function removeMember(Family $family, User $user)
    {
        // Prevent removing the last admin
        $isLastAdmin = $family->familyUsers()
            ->where('role', FamilyRole::Admin)
            ->count() === 1
            && $family->familyUsers()
                ->where('user_id', $user->id)
                ->where('role', FamilyRole::Admin)
                ->exists();

        if ($isLastAdmin) {
            return back()->withErrors(['member' => 'Cannot remove the last admin of a family.']);
        }

        $family->familyUsers()->where('user_id', $user->id)->delete();

        return back();
    }

    public function updateMemberRole(Request $request, Family $family, User $user)
    {
        $request->validate(['role' => 'required|in:admin,member']);

        $family->familyUsers()
            ->where('user_id', $user->id)
            ->update(['role' => $request->role]);

        return back();
    }
}
