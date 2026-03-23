<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PocketMoneyScheduleResource;
use App\Http\Resources\SpenderResource;
use App\Models\Account;
use App\Models\ChoreCompletion;
use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Models\Transaction;
use App\Services\SpenderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PocketMoneyController extends Controller
{
    public function release(Request $request): JsonResponse
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $familyIds = $user->families()
            ->when($familyId, fn ($q, $id) => $q->where('families.id', $id))
            ->pluck('families.id');

        $spenders = Spender::whereIn('family_id', $familyIds)
            ->with([
                'accounts',
                'pocketMoneySchedules' => fn ($q) => $q->where('is_active', true),
                'chores' => fn ($q) => $q->where('reward_type', 'responsibility')->where('is_active', true),
            ])
            ->get();

        return response()->json([
            'data' => SpenderResource::collection($spenders),
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

        // Deactivate existing
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
