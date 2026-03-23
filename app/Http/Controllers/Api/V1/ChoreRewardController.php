<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ChoreRewardController as WebChoreRewardController;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChoreRewardResource;
use App\Models\ChoreReward;
use App\Models\Spender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChoreRewardController extends Controller
{
    public function store(Request $request, Spender $spender): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $spender->family_id)->exists(), 403);

        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
            'payout_date' => ['nullable', 'date'],
            'account_id' => ['nullable', 'uuid', 'exists:accounts,id'],
            'chore_ids' => ['required', 'array', 'min:1'],
            'chore_ids.*' => ['uuid', 'exists:chores,id'],
        ]);

        $reward = ChoreReward::create([
            'spender_id' => $spender->id,
            'account_id' => $request->input('account_id'),
            'amount' => $request->input('amount'),
            'description' => $request->input('description'),
            'payout_date' => $request->input('payout_date'),
            'created_by' => $user->id,
        ]);

        $reward->chores()->sync($request->input('chore_ids'));

        // If no payout date and all chores complete, pay immediately
        if (! $request->input('payout_date') && $reward->allChoresCompleted()) {
            WebChoreRewardController::pay($reward);
        }

        $reward->load(['chores', 'account']);

        return response()->json([
            'data' => new ChoreRewardResource($reward),
        ], 201);
    }

    public function destroy(Request $request, ChoreReward $choreReward): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $choreReward->spender->family_id)->exists(), 403);

        $choreReward->delete();

        return response()->json(['message' => 'Chore reward deleted']);
    }
}
