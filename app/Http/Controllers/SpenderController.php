<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpenderRequest;
use App\Mail\ChildInvitationMail;
use App\Models\ChildInvitation;
use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Models\SpenderUser;
use App\Models\User;
use Bentonow\BentoLaravel\DataTransferObjects\EventData;
use Bentonow\BentoLaravel\Facades\Bento;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

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
                $topGoal = $spender->savingsGoals
                    ->where('is_completed', false)
                    ->sortBy('sort_order')
                    ->first();
                $spender->setRelation('closest_goal', $topGoal);
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

        $pendingInvitations = $isParentInFamily
            ? $spender->childInvitations()->where('expires_at', '>', now())->get()
            : collect();

        $spender->load([
            'accounts.transactions' => fn($q) => $q->latest('occurred_at')->limit(20),
            'savingsGoals'          => fn($q) => $q->orderBy('sort_order'),
            'savingsGoals.account',
            'family',
            'users',
        ]);

        // Compute cascade allocations per account
        \App\Models\SavingsGoal::applyAccountAllocations($spender->savingsGoals);

        return Inertia::render('Spenders/Show', [
            'spender'            => $spender,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }

    public function linkChild(Request $request, Spender $spender)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            SpenderUser::firstOrCreate([
                'spender_id' => $spender->id,
                'user_id'    => $user->id,
            ]);
            return back()->with('success', 'Child account linked.');
        }

        // User doesn't exist yet — send an invitation email
        ChildInvitation::where('spender_id', $spender->id)
            ->where('email', $request->email)
            ->delete();

        $invitation = ChildInvitation::create([
            'spender_id' => $spender->id,
            'email'      => $request->email,
            'token'      => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);

        /** @var User $sender */
        $sender = $request->user();
        Mail::to($request->email)->send(
            new ChildInvitationMail(
                $invitation->load('spender'),
                $sender->display_name ?? $sender->name,
            )
        );

        return back()->with('success', "Invitation sent to {$request->email}.");
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

        rescue(function () use ($request, $spender): void {
            Bento::trackEvent(collect([
                new EventData(
                    type: '$added_child',
                    email: $request->user()->email,
                    fields: ['child_name' => $spender->name],
                ),
            ]));
        });

        return redirect()->route('spenders.show', $spender);
    }

    public function edit(Spender $spender)
    {
        $spender->load('accounts');

        $schedule = PocketMoneySchedule::where('spender_id', $spender->id)
            ->where('is_active', true)
            ->with('account')
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
