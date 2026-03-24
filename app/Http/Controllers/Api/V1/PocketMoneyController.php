<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CompletionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PocketMoneyScheduleResource;
use App\Models\Chore;
use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Models\Transaction;
use App\Services\NotificationService;
use App\Services\SpenderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PocketMoneyController extends Controller
{
    public function release(Request $request): JsonResponse
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $familyIds = $user->families()
            ->when($familyId, fn ($q, $id) => $q->where('families.id', $id))
            ->pluck('families.id');

        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();

        $spenders = Spender::whereIn('family_id', $familyIds)
            ->with([
                'accounts',
                'pocketMoneySchedules' => fn ($q) => $q->where('is_active', true),
                'chores' => fn ($q) => $q->where('reward_type', 'responsibility')->where('is_active', true),
                'choreCompletions' => fn ($q) => $q->whereBetween('completed_at', [$weekStart, $weekEnd]),
            ])
            ->get();

        $spenderData = $spenders->map(function (Spender $spender) use ($weekStart, $weekEnd): array {
            $accountIds = $spender->accounts->pluck('id');

            $paidThisWeek = Transaction::whereIn('account_id', $accountIds)
                ->where('description', 'Pocket money')
                ->whereBetween('occurred_at', [$weekStart, $weekEnd])
                ->exists();

            /** @var Collection<int, Chore> $responsibilityChores */
            $responsibilityChores = $spender->chores->where('reward_type', 'responsibility');
            $completedChoreIds = $spender->choreCompletions
                ->whereIn('status', [CompletionStatus::Approved, CompletionStatus::Pending])
                ->unique('chore_id')
                ->pluck('chore_id');

            $allMet = $responsibilityChores->every(
                fn (Chore $c) => $completedChoreIds->contains($c->id)
            );

            $schedule = $spender->pocketMoneySchedules->first();
            $amount = $schedule ? (string) $schedule->amount : '0.00';
            $isDue = $schedule !== null && ! $paidThisWeek;

            return [
                'spender' => [
                    'id' => $spender->id,
                    'name' => $spender->name,
                    'avatar_url' => $spender->avatar_url,
                    'color' => $spender->color,
                    'currency_symbol' => $spender->currency_symbol,
                    'use_integer_amounts' => $spender->use_integer_amounts,
                ],
                'schedule' => $schedule ? [
                    'id' => $schedule->id,
                    'amount' => $schedule->amount,
                    'frequency' => $schedule->frequency,
                    'day_of_week' => $schedule->day_of_week,
                    'day_of_month' => $schedule->day_of_month,
                    'next_run_at' => $schedule->next_run_at?->toIso8601String(),
                ] : null,
                'amount' => $amount,
                'responsibility_chores' => $responsibilityChores->values()->map(fn (Chore $c) => [
                    'chore' => ['id' => $c->id, 'name' => $c->name, 'emoji' => $c->emoji],
                    'completed' => $completedChoreIds->contains($c->id),
                ]),
                'all_responsibilities_met' => $allMet,
                'is_due' => $isDue,
                'paid_this_week' => $paidThisWeek,
            ];
        });

        return response()->json([
            'data' => ['spenders' => $spenderData->values()],
        ]);
    }

    public function pay(Request $request): JsonResponse
    {
        $request->validate([
            'spender_id' => ['required', 'uuid', 'exists:spenders,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $spender = Spender::findOrFail($request->input('spender_id'));
        abort_unless($request->user()->families()->where('families.id', $spender->family_id)->exists(), 403);

        $account = SpenderService::mainAccount($spender);

        Transaction::create([
            'account_id' => $account->id,
            'type' => 'credit',
            'amount' => $request->input('amount'),
            'description' => 'Pocket money',
            'occurred_at' => now(),
            'created_by' => $request->user()->id,
        ]);

        $account->increment('balance', $request->input('amount'));

        rescue(fn () => NotificationService::pocketMoneyPaid($spender));

        return response()->json(['message' => 'Pocket money paid']);
    }

    public function storeSchedule(Request $request, Spender $spender): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $spender->family_id)->exists(), 403);

        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'frequency' => ['required', 'in:weekly,monthly'],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'day_of_month' => ['nullable', 'integer', 'min:1', 'max:31'],
            'account_id' => ['nullable', 'uuid', 'exists:accounts,id'],
        ]);

        PocketMoneySchedule::where('spender_id', $spender->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $schedule = PocketMoneySchedule::create([
            'spender_id' => $spender->id,
            'account_id' => $request->input('account_id'),
            'amount' => $request->input('amount'),
            'frequency' => $request->input('frequency'),
            'day_of_week' => $request->input('day_of_week'),
            'day_of_month' => $request->input('day_of_month'),
            'is_active' => true,
            'next_run_at' => PocketMoneySchedule::computeNextRunAt(
                $request->input('frequency'),
                $request->input('day_of_week'),
                $request->input('day_of_month'),
            ),
            'created_by' => $user->id,
        ]);

        return response()->json([
            'data' => new PocketMoneyScheduleResource($schedule),
        ], 201);
    }

    public function destroySchedule(Request $request, PocketMoneySchedule $schedule): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $schedule->spender->family_id)->exists(), 403);

        $schedule->update(['is_active' => false]);

        return response()->json(['message' => 'Schedule deactivated']);
    }
}
