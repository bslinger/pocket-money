<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpenderRequest;
use App\Mail\ChildInvitationMail;
use App\Models\ChildInvitation;
use App\Models\PocketMoneySchedule;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Models\SpenderDevice;
use App\Models\SpenderLinkCode;
use App\Models\SpenderUser;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AnalyticsService;
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

        if (! $family) {
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
            'family' => $family,
            'spenders' => $spenders,
        ]);
    }

    public function show(Spender $spender)
    {
        $user = auth()->user();

        $isParentInFamily = $user->isParent()
            && $user->families()->where('families.id', $spender->family_id)->exists();
        $isLinkedChild = ! $user->isParent()
            && $user->spenders()->where('spenders.id', $spender->id)->exists();

        if (! $isParentInFamily && ! $isLinkedChild) {
            abort(403);
        }

        $pendingInvitations = $isParentInFamily
            ? $spender->childInvitations()->where('expires_at', '>', now())->get()
            : collect();

        $spender->load([
            'accounts.transactions' => fn ($q) => $q->latest('occurred_at')->limit(20),
            'savingsGoals' => fn ($q) => $q->orderBy('sort_order'),
            'savingsGoals.account',
            'chores' => fn ($q) => $q->where('is_active', true)->orderBy('name'),
            'choreCompletions' => fn ($q) => $q->with('chore')->latest('completed_at')->limit(50),
            'family',
            'users',
        ]);

        // Compute cascade allocations per account
        SavingsGoal::applyAccountAllocations($spender->savingsGoals);

        // Aggregate transactions across all accounts for the Transactions tab
        $allAccountIds = $spender->accounts->pluck('id');
        $transactions = Transaction::whereIn('account_id', $allAccountIds)
            ->with('account')
            ->latest('occurred_at')
            ->limit(100)
            ->get();

        $spenderDevices = $isParentInFamily
            ? $spender->devices()->whereNull('revoked_at')->orderByDesc('last_active_at')->get()
            : collect();

        $pocketMoneySchedule = $isParentInFamily
            ? PocketMoneySchedule::where('spender_id', $spender->id)
                ->where('is_active', true)
                ->with(['account', 'splits.account'])
                ->first()
            : null;

        return Inertia::render('Spenders/Show', [
            'spender' => $spender,
            'pendingInvitations' => $pendingInvitations,
            'transactions' => $transactions,
            'spenderDevices' => $spenderDevices,
            'pocketMoneySchedule' => $pocketMoneySchedule,
        ]);
    }

    public function linkChild(Request $request, Spender $spender)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            SpenderUser::firstOrCreate([
                'spender_id' => $spender->id,
                'user_id' => $user->id,
            ]);

            return back()->with('success', 'Child account linked.');
        }

        // User doesn't exist yet — send an invitation email
        ChildInvitation::where('spender_id', $spender->id)
            ->where('email', $request->email)
            ->delete();

        $invitation = ChildInvitation::create([
            'spender_id' => $spender->id,
            'email' => $request->email,
            'token' => Str::random(64),
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
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->get();

        return Inertia::render('Spenders/Create', [
            'families' => $families,
        ]);
    }

    public function store(StoreSpenderRequest $request)
    {
        $spender = Spender::create($request->validated());

        $spender->accounts()->create([
            'name' => 'Savings',
            'balance' => 0,
        ]);

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'spender', 'created'));

        return redirect()->route('spenders.show', $spender);
    }

    public function edit(Spender $spender)
    {
        $spender->load('accounts');

        $schedule = PocketMoneySchedule::where('spender_id', $spender->id)
            ->where('is_active', true)
            ->with(['account', 'splits.account'])
            ->first();

        return Inertia::render('Spenders/Edit', [
            'spender' => $spender,
            'family' => $spender->family,
            'pocketMoneySchedule' => $schedule,
        ]);
    }

    public function update(StoreSpenderRequest $request, Spender $spender)
    {
        $spender->update($request->validated());

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'spender', 'updated'));

        return redirect()->route('spenders.show', $spender);
    }

    public function destroy(Spender $spender)
    {
        $familyId = $spender->family_id;
        $spender->delete(); // soft-delete (archive)

        rescue(fn () => app(AnalyticsService::class)->crudEvent(auth()->user(), 'spender', 'archived'));

        return redirect()->route('families.show', $familyId);
    }

    public function restore(string $id)
    {
        $spender = Spender::withTrashed()->findOrFail($id);
        $spender->restore();

        rescue(fn () => app(AnalyticsService::class)->crudEvent(auth()->user(), 'spender', 'restored'));

        return redirect()->route('families.show', $spender->family_id);
    }

    public function generateLinkCode(Spender $spender)
    {
        $user = auth()->user();
        abort_unless($user->families()->where('families.id', $spender->family_id)->exists(), 403);

        $code = SpenderLinkCode::create([
            'spender_id' => $spender->id,
            'family_id' => $spender->family_id,
            'code' => SpenderLinkCode::generateCode(),
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        /** @var Carbon $expiresAt */
        $expiresAt = $code->expires_at;

        $linkCodeData = [
            'code' => $code->code,
            'expires_at' => $expiresAt->toIso8601String(),
        ];

        if (request()->wantsJson()) {
            return response()->json(['data' => $linkCodeData], 201);
        }

        return back()->with('linkCode', $linkCodeData);
    }

    public function revokeDevice(SpenderDevice $device)
    {
        $user = auth()->user();

        /** @var Spender $spender */
        $spender = $device->spender;
        abort_unless($user->families()->where('families.id', $spender->family_id)->exists(), 403);

        $device->revoke();

        return back();
    }
}
