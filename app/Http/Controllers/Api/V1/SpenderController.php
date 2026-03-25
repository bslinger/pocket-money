<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSpenderRequest;
use App\Http\Resources\SpenderResource;
use App\Models\SavingsGoal;
use App\Models\Spender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpenderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $familyId = $request->input('family_id');
        $user = $request->user();

        $query = Spender::query()
            ->whereIn('family_id', $user->families()->pluck('families.id'));

        if ($familyId) {
            $query->where('family_id', $familyId);
        }

        $spenders = $query->with(['accounts', 'savingsGoals'])->get();

        return response()->json([
            'data' => SpenderResource::collection($spenders),
        ]);
    }

    public function show(Request $request, Spender $spender): JsonResponse
    {
        $user = $request->user();
        $isParent = $user->isParent() && $user->families()->where('families.id', $spender->family_id)->exists();
        $isChild = $user->isChildFor($spender);

        abort_unless($isParent || $isChild, 403);

        $spender->load([
            'accounts',
            'savingsGoals' => fn ($q) => $q->orderBy('sort_order'),
            'savingsGoals.account',
            'family',
            'chores' => fn ($q) => $q->where('is_active', true),
            'choreCompletions' => fn ($q) => $q->whereBetween('completed_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ])->orderByDesc('completed_at'),
            'users',
            'pocketMoneySchedules' => fn ($q) => $q->where('is_active', true),
            'pocketMoneySchedules.splits.account',
        ]);

        SavingsGoal::applyAccountAllocations($spender->savingsGoals);

        return response()->json([
            'data' => new SpenderResource($spender),
        ]);
    }

    public function store(StoreSpenderRequest $request): JsonResponse
    {
        $spender = Spender::create($request->validated());

        $spender->accounts()->create([
            'name' => 'Savings',
            'balance' => 0,
        ]);

        return response()->json([
            'data' => new SpenderResource($spender),
        ], 201);
    }

    public function update(StoreSpenderRequest $request, Spender $spender): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $spender->family_id)->exists(), 403);

        $spender->update($request->validated());

        return response()->json([
            'data' => new SpenderResource($spender->fresh()),
        ]);
    }

    public function destroy(Request $request, Spender $spender): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $spender->family_id)->exists(), 403);

        $spender->delete();

        return response()->json(['message' => 'Spender archived']);
    }
}
