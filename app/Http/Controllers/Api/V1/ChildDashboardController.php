<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChildDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var Spender $spender */
        $spender = $request->attributes->get('spender');

        $spender->load([
            'accounts',
            'savingsGoals' => fn ($q) => $q->where('is_completed', false)->whereNull('abandoned_at')->orderBy('sort_order'),
            'chores' => fn ($q) => $q->where('is_active', true),
            'choreCompletions' => fn ($q) => $q->where('completed_at', '>=', now()->startOfWeek()),
            'pocketMoneySchedules',
            'family',
        ]);

        /** @var float $balance */
        $balance = $spender->accounts->sum(fn (Account $a) => (float) $a->balance);

        return response()->json([
            'data' => [
                'spender' => [
                    'id' => $spender->id,
                    'name' => $spender->name,
                    'color' => $spender->color,
                    'avatar_url' => $spender->getAttributeValue('avatar_url'),
                    /** @phpstan-ignore property.notFound */
                    'family_name' => $spender->family?->name,
                ],
                'balance' => number_format($balance, 2, '.', ''),
                'accounts' => $spender->accounts->map(fn (Account $a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'balance' => $a->balance,
                ]),
                'goals' => $spender->savingsGoals->map(fn (SavingsGoal $g) => [
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
                'completions_this_week' => $spender->choreCompletions->map(fn (ChoreCompletion $cc): array => [
                    'id' => $cc->id,
                    'chore_id' => $cc->chore_id,
                    'status' => $cc->status,
                    'completed_at' => $cc->completed_at->toIso8601String(),
                ]),
            ],
        ]);
    }

    public function completeChore(Request $request, string $choreId): JsonResponse
    {
        /** @var Spender $spender */
        $spender = $request->attributes->get('spender');

        /** @var Chore|null $chore */
        $chore = $spender->chores()->where('chores.id', $choreId)->where('is_active', true)->first();

        if (! $chore) {
            return response()->json(['message' => 'Chore not found or not assigned to you.'], 404);
        }

        /** @var ChoreCompletion $completion */
        $completion = $spender->choreCompletions()->create([
            'chore_id' => $chore->id,
            'completed_at' => now(),
            'status' => $chore->requires_approval ? 'pending' : 'approved',
        ]);

        return response()->json([
            'data' => [
                'id' => $completion->id,
                'chore_id' => $completion->chore_id,
                'status' => $completion->status,
                'completed_at' => $completion->completed_at->toIso8601String(),
            ],
        ], 201);
    }

    public function transactions(Request $request, string $accountId): JsonResponse
    {
        /** @var Spender $spender */
        $spender = $request->attributes->get('spender');

        $account = $spender->accounts()->where('id', $accountId)->first();

        if (! $account) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $transactions = $account->transactions()
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            /** @phpstan-ignore argument.type, argument.unresolvableType */
            ->map(fn (Transaction $t): array => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => $t->amount,
                'description' => $t->description,
                /** @phpstan-ignore method.nonObject */
                'occurred_at' => $t->occurred_at->toIso8601String(),
            ]);

        return response()->json(['data' => $transactions]);
    }
}
