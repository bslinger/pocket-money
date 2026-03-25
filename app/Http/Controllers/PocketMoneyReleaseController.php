<?php

namespace App\Http\Controllers;

use App\Enums\CompletionStatus;
use App\Models\Chore;
use App\Models\Spender;
use App\Models\Transaction;
use App\Services\AnalyticsService;
use App\Services\NotificationService;
use App\Services\SpenderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PocketMoneyReleaseController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_if($user === null, 401);

        $familyIds = $user->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->pluck('families.id');

        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();

        $spenders = Spender::whereIn('family_id', $familyIds)
            ->with([
                'accounts',
                'pocketMoneySchedules' => fn ($q) => $q->where('is_active', true)->with('account'),
                'chores' => fn ($q) => $q->where('reward_type', 'responsibility')->where('is_active', true),
                'choreCompletions' => fn ($q) => $q->whereBetween('completed_at', [$weekStart, $weekEnd]),
            ])
            ->get();

        $spenderData = $spenders->map(function (Spender $spender) use ($weekStart, $weekEnd) {
            $accountIds = $spender->accounts->pluck('id');

            $thisWeekPayments = Transaction::whereIn('account_id', $accountIds)
                ->where('description', 'Pocket money')
                ->whereBetween('occurred_at', [$weekStart, $weekEnd])
                ->orderByDesc('occurred_at')
                ->get(['id', 'account_id', 'amount', 'occurred_at']);

            $recentTransactions = Transaction::whereIn('account_id', $accountIds)
                ->where('description', 'Pocket money')
                ->orderByDesc('occurred_at')
                ->limit(10)
                ->get(['id', 'account_id', 'amount', 'occurred_at']);

            /** @var \Illuminate\Database\Eloquent\Collection<int, Chore> $responsibilityChores */
            $responsibilityChores = $spender->chores->where('reward_type', 'responsibility');
            $completedChoreIds = $spender->choreCompletions
                ->whereIn('status', [CompletionStatus::Approved, CompletionStatus::Pending])
                ->unique('chore_id')
                ->pluck('chore_id');

            /** @var Collection<int, Chore> $unmetResponsibilities */
            $unmetResponsibilities = $responsibilityChores->filter(
                fn (Chore $c) => ! $completedChoreIds->contains($c->id)
            )->values();

            $hasActiveSchedule = $spender->pocketMoneySchedules->isNotEmpty();
            $paidThisWeek = $thisWeekPayments->isNotEmpty();
            $withheld = $hasActiveSchedule && ! $paidThisWeek && $unmetResponsibilities->isNotEmpty();
            $withheldAmount = $withheld
                ? (float) $spender->pocketMoneySchedules->sum('amount')
                : 0.0;

            return [
                'spender' => $spender->only(['id', 'name', 'avatar_url', 'color', 'currency_name', 'currency_name_plural', 'currency_symbol', 'use_integer_amounts']),
                'schedules' => $spender->pocketMoneySchedules->values(),
                'paid_this_week' => $paidThisWeek,
                'this_week_payments' => $thisWeekPayments->values(),
                'recent_transactions' => $recentTransactions->values(),
                'responsibility_chores_total' => $responsibilityChores->count(),
                'responsibility_chores_done' => $responsibilityChores->count() - $unmetResponsibilities->count(),
                'unmet_responsibilities' => $unmetResponsibilities->map(fn (Chore $c) => ['id' => $c->id, 'name' => $c->name]),
                'withheld' => $withheld,
                'withheld_amount' => number_format($withheldAmount, 2, '.', ''),
            ];
        });

        return Inertia::render('PocketMoney/Release', [
            'spenders' => $spenderData->values(),
        ]);
    }

    public function pay(Request $request): RedirectResponse
    {
        $request->validate([
            'spender_id' => ['required', 'uuid', 'exists:spenders,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $spender = Spender::findOrFail($request->input('spender_id'));

        DB::transaction(function () use ($spender, $request) {
            $account = SpenderService::mainAccount($spender);
            Transaction::create([
                'account_id' => $account->id,
                'type' => 'credit',
                'amount' => $request->input('amount'),
                'description' => 'Pocket money',
                'occurred_at' => now(),
                'created_by' => auth()->id(),
            ]);
            $account->increment('balance', (float) $request->input('amount'));
        });

        rescue(fn () => NotificationService::pocketMoneyPaid($spender));
        rescue(fn () => app(AnalyticsService::class)->pocketMoneyReleased(
            auth()->id(),
            1,
        ));

        return back()->with('success', 'Pocket money paid!');
    }
}
