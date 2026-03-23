<?php

namespace App\Http\Controllers;

use App\Enums\FamilyRole;
use App\Http\Requests\StoreFamilyRequest;
use App\Mail\FamilyInvitation;
use App\Models\Account;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\Invitation;
use App\Models\Spender;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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
        $validated = $request->validated();
        $spendersData = $validated['spenders'] ?? [];
        unset($validated['spenders']);

        $validated['billing_user_id'] = auth()->id();
        $family = Family::create($validated);
        FamilyUser::create([
            'family_id' => $family->id,
            'user_id' => auth()->id(),
            'role' => FamilyRole::Admin,
        ]);

        $family->grantTrialIfEligible(auth()->user());

        foreach ($spendersData as $spenderInput) {
            /** @var array{name: string, color?: string|null} $spenderInput */
            $spender = Spender::create([
                'family_id' => $family->id,
                'name' => $spenderInput['name'],
                'color' => $spenderInput['color'] ?? '#6366f1',
            ]);
            Account::create([
                'spender_id' => $spender->id,
                'name' => 'Savings',
                'balance' => 0,
            ]);
        }

        return redirect()->route('families.show', $family);
    }

    public function show(Family $family)
    {
        $family->load(['familyUsers.user']);
        $family->setRelation('spenders',
            $family->spenders()->withTrashed()->with('accounts')->get()
        );

        $pendingInvitations = Invitation::where('family_id', $family->id)
            ->where('expires_at', '>', now())
            ->select(['id', 'email', 'role', 'expires_at'])
            ->get();

        return Inertia::render('Families/Show', [
            'family' => $family,
            'authUserId' => auth()->id(),
            'pendingInvitations' => $pendingInvitations,
            'isAdmin' => FamilyUser::where('family_id', $family->id)
                ->where('user_id', auth()->id())
                ->where('role', FamilyRole::Admin)
                ->exists(),
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

        $email = strtolower(trim($request->email));
        $inviter = $request->user();

        // If the user already has an account, add them directly
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            FamilyUser::firstOrCreate(
                ['family_id' => $family->id, 'user_id' => $existingUser->id],
                ['role' => FamilyRole::Member]
            );

            return back()->with('success', 'Member added to the family.');
        }

        // Otherwise create/refresh an invitation and send an email
        /** @var Invitation $invitation */
        $invitation = Invitation::updateOrCreate(
            ['family_id' => $family->id, 'email' => $email],
            [
                'token' => Str::random(64),
                'role' => 'member',
                'expires_at' => now()->addDays(7),
            ]
        );
        $invitation->load('family');

        $inviterName = $inviter !== null
            ? ($inviter->display_name ?? $inviter->name)
            : 'A family member';

        Mail::to($email)->send(new FamilyInvitation($invitation, $inviterName));

        return back()->with('success', 'Invitation email sent to '.$email.'.');
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

    public function revokeInvitation(Family $family, Invitation $invitation): RedirectResponse
    {
        abort_unless($invitation->family_id === $family->id, 404);

        $invitation->delete();

        return back()->with('success', 'Invitation revoked.');
    }
}
