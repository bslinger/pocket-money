<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSavingsGoalRequest;
use App\Http\Resources\SavingsGoalResource;
use App\Models\SavingsGoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingsGoalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $familyIds = $user->families()
            ->when($familyId, fn ($q, $id) => $q->where('families.id', $id))
            ->pluck('families.id');

        $goals = SavingsGoal::whereHas('spender', fn ($q) => $q->whereIn('family_id', $familyIds))
            ->whereNull('abandoned_at')
            ->with(['spender', 'account'])
            ->orderBy('sort_order')
            ->get();

        SavingsGoal::applyAccountAllocations($goals);

        return response()->json([
            'data' => SavingsGoalResource::collection($goals),
        ]);
    }

    public function show(Request $request, SavingsGoal $goal): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $goal->spender->family_id)->exists(), 403);

        $goal->load(['spender', 'account']);

        // Compute allocated amount for this goal
        if ($goal->account) {
            $accountGoals = SavingsGoal::where('account_id', $goal->account_id)
                ->whereNull('abandoned_at')
                ->orderBy('sort_order')
                ->get();
            SavingsGoal::computeAllocations($accountGoals, (float) $goal->account->balance);

            $match = $accountGoals->firstWhere('id', $goal->id);
            if ($match) {
                $goal->setAttribute('allocated_amount', $match->allocated_amount);
            }
        }

        return response()->json([
            'data' => new SavingsGoalResource($goal),
        ]);
    }

    public function store(StoreSavingsGoalRequest $request): JsonResponse
    {
        $maxSort = SavingsGoal::where('account_id', $request->account_id)->max('sort_order') ?? -1;

        $goal = SavingsGoal::create([
            ...$request->validated(),
            'spender_id' => $request->input('spender_id'),
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json([
            'data' => new SavingsGoalResource($goal),
        ], 201);
    }

    public function update(StoreSavingsGoalRequest $request, SavingsGoal $goal): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $goal->spender->family_id)->exists(), 403);

        $goal->update($request->validated());

        return response()->json([
            'data' => new SavingsGoalResource($goal->fresh()),
        ]);
    }

    public function destroy(Request $request, SavingsGoal $goal): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $goal->spender->family_id)->exists(), 403);

        $goal->delete();

        return response()->json(['message' => 'Goal deleted']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'goal_ids' => ['required', 'array'],
            'goal_ids.*' => ['uuid'],
        ]);

        foreach ($request->input('goal_ids') as $index => $id) {
            SavingsGoal::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Goals reordered']);
    }

    public function abandon(Request $request, SavingsGoal $goal): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $goal->spender->family_id)->exists(), 403);

        if ($goal->created_at->diffInHours(now()) < 24) {
            $goal->delete();

            return response()->json(['message' => 'Goal deleted']);
        }

        // Compute allocated amount before abandoning
        $allocatedAmount = '0.00';
        if ($goal->account) {
            $accountGoals = SavingsGoal::where('account_id', $goal->account_id)
                ->whereNull('abandoned_at')
                ->orderBy('sort_order')
                ->get();
            SavingsGoal::computeAllocations($accountGoals, (float) $goal->account->balance);
            $match = $accountGoals->firstWhere('id', $goal->id);
            if ($match) {
                $allocatedAmount = $match->allocated_amount;
            }
        }

        $goal->update([
            'abandoned_at' => now(),
            'abandoned_allocated_amount' => $allocatedAmount,
        ]);

        return response()->json(['message' => 'Goal abandoned']);
    }
}
