<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ChoreCompletionController as WebChoreCompletionController;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChoreCompletionResource;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChoreCompletionController extends Controller
{
    public function store(Request $request, Chore $chore): JsonResponse
    {
        $request->validate([
            'spender_id' => ['required', 'uuid', 'exists:spenders,id'],
        ]);

        $user = $request->user();
        $spenderId = $request->input('spender_id');

        // Same authorization as web controller
        $isChild = $user->spenders()->where('spenders.id', $spenderId)->exists();
        $isParentViewing = $user->isParent() && $user->families()->where('families.id', $chore->family_id)->exists();

        abort_unless($isChild || $isParentViewing, 403);

        // Check assignment
        if (! $chore->up_for_grabs && ! $chore->spenders()->where('spenders.id', $spenderId)->exists()) {
            return response()->json(['message' => 'Spender is not assigned to this chore'], 422);
        }

        // Check for existing pending completion
        $existing = ChoreCompletion::where('chore_id', $chore->id)
            ->where('spender_id', $spenderId)
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'A pending completion already exists'], 422);
        }

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spenderId,
            'status' => 'pending',
            'completed_at' => now(),
        ]);

        $completion->load(['chore', 'spender']);

        rescue(fn () => NotificationService::choreSubmittedForApproval($completion));

        return response()->json([
            'data' => new ChoreCompletionResource($completion),
        ], 201);
    }

    public function approve(Request $request, ChoreCompletion $completion): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $completion->chore->family_id)->exists(), 403);

        // Delegate to existing web controller logic
        $webController = new WebChoreCompletionController;
        $webController->approve($completion);

        return response()->json([
            'data' => new ChoreCompletionResource($completion->fresh(['chore', 'spender'])),
        ]);
    }

    public function decline(Request $request, ChoreCompletion $completion): JsonResponse
    {
        $request->validate([
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        abort_unless($user->families()->where('families.id', $completion->chore->family_id)->exists(), 403);

        $completion->update([
            'status' => 'declined',
            'reviewed_at' => now(),
            'reviewed_by' => $user->id,
            'note' => $request->input('note'),
        ]);

        rescue(fn () => NotificationService::choreDeclined($completion));

        return response()->json([
            'data' => new ChoreCompletionResource($completion->fresh(['chore', 'spender'])),
        ]);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['uuid'],
        ]);

        $user = $request->user();
        $completions = ChoreCompletion::whereIn('id', $request->input('ids'))
            ->where('status', 'pending')
            ->with(['chore', 'spender'])
            ->get();

        $webController = new WebChoreCompletionController;
        foreach ($completions as $completion) {
            if ($user->families()->where('families.id', $completion->chore->family_id)->exists()) {
                $webController->approve($completion);
            }
        }

        return response()->json([
            'data' => ChoreCompletionResource::collection($completions->fresh(['chore', 'spender'])),
        ]);
    }
}
