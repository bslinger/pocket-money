<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChoreCompletionResource;
use App\Http\Resources\FamilyResource;
use App\Http\Resources\SpenderResource;
use App\Http\Resources\TransactionResource;
use App\Models\ChoreCompletion;
use App\Models\SavingsGoal;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isParent = $user->isParent();
        $hasSpenders = $user->spenderUsers()->exists();

        if ($isParent || ! $hasSpenders) {
            return $this->parentDashboard($request);
        }

        return $this->childDashboard($request);
    }

    private function parentDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeFamilyId = $request->input('family_id');

        $families = $user->families()
            ->when($activeFamilyId, fn ($q, $id) => $q->where('families.id', $id))
            ->with([
                'spenders.accounts',
                'spenders.savingsGoals' => fn ($q) => $q->orderBy('sort_order'),
                'spenders.savingsGoals.account',
            ])
            ->get();

        foreach ($families as $family) {
            foreach ($family->spenders as $spender) {
                SavingsGoal::applyAccountAllocations($spender->savingsGoals);
            }
        }

        $familyIds = $families->pluck('id');

        $pendingCompletions = ChoreCompletion::where('status', 'pending')
            ->whereHas('chore', fn ($q) => $q->whereIn('family_id', $familyIds))
            ->with(['chore', 'spender'])
            ->latest('completed_at')
            ->limit(20)
            ->get();

        $recentActivity = Transaction::whereHas('account.spender',
            fn ($q) => $q->whereIn('family_id', $familyIds))
            ->with('account.spender.family')
            ->latest('occurred_at')
            ->limit(15)
            ->get();

        $totalBalance = $families->flatMap(fn ($f) => $f->spenders)
            ->flatMap(fn ($s) => $s->accounts)
            ->sum('balance');

        $paidThisMonth = Transaction::whereHas('account.spender',
            fn ($q) => $q->whereIn('family_id', $familyIds))
            ->where('type', 'credit')
            ->where('occurred_at', '>=', now()->startOfMonth())
            ->sum('amount');

        return response()->json([
            'data' => [
                'is_parent' => true,
                'families' => FamilyResource::collection($families),
                'spenders' => [],
                'pending_completions' => ChoreCompletionResource::collection($pendingCompletions),
                'recent_activity' => TransactionResource::collection($recentActivity),
                'total_balance' => number_format((float) $totalBalance, 2, '.', ''),
                'paid_this_month' => number_format((float) $paidThisMonth, 2, '.', ''),
            ],
        ]);
    }

    private function childDashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $spenders = $user->spenders()->with([
            'accounts',
            'savingsGoals' => fn ($q) => $q->orderBy('sort_order'),
            'savingsGoals.account',
            'family',
            'chores' => fn ($q) => $q->where('is_active', true),
            'choreCompletions' => fn ($q) => $q->whereBetween('completed_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ])->with('reviewer:id,name,parent_title')->orderByDesc('completed_at'),
        ])->get();

        foreach ($spenders as $spender) {
            SavingsGoal::applyAccountAllocations($spender->savingsGoals);
        }

        return response()->json([
            'data' => [
                'is_parent' => false,
                'families' => [],
                'spenders' => SpenderResource::collection($spenders),
                'pending_completions' => [],
                'recent_activity' => [],
                'total_balance' => '0.00',
                'paid_this_month' => '0.00',
            ],
        ]);
    }
}
