<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\Family;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyScreenDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Family $family */
        $family = $request->attributes->get('family_screen_family');

        $family->load([
            'spenders' => fn ($q) => $q->whereNull('deleted_at')->orderBy('created_at'),
        ]);

        $spenders = $family->spenders ?? collect();

        /** @phpstan-ignore method.notFound */
        $spenders->load([
            'accounts',
            'savingsGoals' => fn ($q) => $q->where('is_completed', false)->whereNull('abandoned_at')->orderBy('sort_order'),
            'chores' => fn ($q) => $q->where('is_active', true),
            'choreCompletions' => fn ($q) => $q->whereDate('completed_at', today()),
        ]);

        return response()->json([
            'data' => [
                'family' => [
                    'id' => $family->id,
                    'name' => $family->name,
                    'currency_symbol' => $family->currency_symbol,
                    'currency_name' => $family->currency_name,
                    'use_integer_amounts' => $family->use_integer_amounts,
                ],
                /** @phpstan-ignore argument.type, return.type */
                'spenders' => $spenders->map(fn (Spender $spender): array => [
                    'id' => $spender->id,
                    'name' => $spender->name,
                    'color' => $spender->color,
                    'avatar_url' => $spender->getAttributeValue('avatar_url'),
                    'balance' => number_format(
                        $spender->accounts->sum(fn (Account $a) => (float) $a->balance),
                        2, '.', ''
                    ),
                    'goals' => $spender->savingsGoals->map(fn (SavingsGoal $g): array => [
                        'id' => $g->id,
                        'name' => $g->name,
                        'target_amount' => $g->target_amount,
                        'allocated_amount' => $g->allocated_amount,
                        'target_date' => $g->target_date,
                    ]),
                    /** @phpstan-ignore argument.type */
                    'chores' => $spender->chores->map(fn (Chore $c): array => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'emoji' => $c->emoji,
                        'frequency' => $c->frequency,
                        'amount' => $c->amount,
                        'reward_type' => $c->reward_type,
                    ]),
                    /** @phpstan-ignore argument.type */
                    'completions_today' => $spender->choreCompletions->map(fn (ChoreCompletion $cc): array => [
                        'id' => $cc->id,
                        'chore_id' => $cc->chore_id,
                        'status' => $cc->status,
                        'completed_at' => $cc->completed_at->toIso8601String(),
                    ]),
                ]),
            ],
        ]);
    }

    public function completeChore(Request $request, string $spenderId, string $choreId): JsonResponse
    {
        /** @var Family $family */
        $family = $request->attributes->get('family_screen_family');

        $spender = $family->spenders()->where('spenders.id', $spenderId)->whereNull('deleted_at')->first();

        if (! $spender) {
            return response()->json(['message' => 'Child not found.'], 404);
        }

        /** @var Chore|null $chore */
        $chore = $spender->chores()->where('chores.id', $choreId)->where('is_active', true)->first();

        if (! $chore) {
            return response()->json(['message' => 'Chore not found or not assigned to this child.'], 404);
        }

        /** @var ChoreCompletion $completion */
        $completion = $spender->choreCompletions()->create([
            'chore_id' => $chore->id,
            'completed_at' => now(),
            'status' => $chore->requires_approval ? 'pending' : 'approved',
        ]);

        if ($chore->requires_approval) {
            rescue(fn () => NotificationService::choreSubmittedForApproval($completion));
        }

        return response()->json([
            'data' => [
                'id' => $completion->id,
                'chore_id' => $completion->chore_id,
                'status' => $completion->status,
                'completed_at' => $completion->completed_at->toIso8601String(),
            ],
        ], 201);
    }
}
