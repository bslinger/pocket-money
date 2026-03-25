<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChoreRequest;
use App\Http\Resources\ChoreCompletionResource;
use App\Http\Resources\ChoreResource;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChoreController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $familyIds = $user->families()
            ->when($familyId, fn ($q, $id) => $q->where('families.id', $id))
            ->pluck('families.id');

        $chores = Chore::whereIn('family_id', $familyIds)
            ->with(['spenders'])
            ->get();

        $weekCompletions = ChoreCompletion::whereHas('chore', fn ($q) => $q->whereIn('family_id', $familyIds))
            ->whereBetween('completed_at', [
                now()->subDay()->startOfDay(),
                now()->addDays(6)->endOfDay(),
            ])
            ->with(['chore', 'spender'])
            ->get();

        $pendingCompletions = ChoreCompletion::where('status', 'pending')
            ->whereHas('chore', fn ($q) => $q->whereIn('family_id', $familyIds))
            ->with(['chore', 'spender'])
            ->latest('completed_at')
            ->get();

        return response()->json([
            'data' => [
                'chores' => ChoreResource::collection($chores),
                'week_completions' => ChoreCompletionResource::collection($weekCompletions),
                'pending_completions' => ChoreCompletionResource::collection($pendingCompletions),
            ],
        ]);
    }

    public function show(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $chore->family_id)->exists(), 403);

        $chore->load(['spenders']);

        return response()->json([
            'data' => new ChoreResource($chore),
        ]);
    }

    public function store(StoreChoreRequest $request): JsonResponse
    {
        $chore = Chore::create([
            ...$request->safe()->except('spender_ids'),
            'created_by' => $request->user()->id,
        ]);

        $chore->spenders()->sync($request->input('spender_ids'));
        $chore->load('spenders');

        return response()->json([
            'data' => new ChoreResource($chore),
        ], 201);
    }

    public function update(StoreChoreRequest $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $chore->family_id)->exists(), 403);

        $chore->update($request->safe()->except('spender_ids'));
        $chore->spenders()->sync($request->input('spender_ids'));
        $chore->load('spenders');

        return response()->json([
            'data' => new ChoreResource($chore),
        ]);
    }

    public function destroy(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $chore->family_id)->exists(), 403);

        $chore->deleteOrForceDelete();

        return response()->json(['message' => 'Chore deleted']);
    }

    public function history(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $chore->family_id)->exists(), 403);

        $completions = $chore->completions()
            ->with(['spender', 'reviewer:id,name'])
            ->latest('completed_at')
            ->paginate(30);

        return ChoreCompletionResource::collection($completions)->response();
    }
}
