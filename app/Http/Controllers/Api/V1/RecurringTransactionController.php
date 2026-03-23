<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecurringTransactionRequest;
use App\Http\Resources\RecurringTransactionResource;
use App\Models\Account;
use App\Models\RecurringTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringTransactionController extends Controller
{
    public function index(Request $request, Account $account): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $recurrings = $account->recurringTransactions()->get();

        return response()->json([
            'data' => RecurringTransactionResource::collection($recurrings),
        ]);
    }

    public function store(StoreRecurringTransactionRequest $request, Account $account): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $recurring = RecurringTransaction::create([
            'account_id' => $account->id,
            ...$request->validated(),
            'created_by' => $user->id,
        ]);

        return response()->json([
            'data' => new RecurringTransactionResource($recurring),
        ], 201);
    }

    public function update(Request $request, Account $account, RecurringTransaction $recurring): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $request->validate([
            'type' => 'required|in:credit,debit',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'frequency' => 'required|in:daily,weekly,fortnightly,monthly,yearly',
            'frequency_config' => 'nullable|array',
            'next_run_at' => 'required|date',
        ]);

        $recurring->update($request->only([
            'type', 'amount', 'description', 'frequency', 'frequency_config', 'next_run_at',
        ]));

        return response()->json([
            'data' => new RecurringTransactionResource($recurring->fresh()),
        ]);
    }

    public function destroy(Request $request, Account $account, RecurringTransaction $recurring): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $recurring->delete();

        return response()->json(['message' => 'Recurring transaction deleted']);
    }
}
