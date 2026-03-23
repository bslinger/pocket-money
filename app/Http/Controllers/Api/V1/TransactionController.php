<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request, Account $account): JsonResponse
    {
        $user = $request->user();
        $spender = $account->spender;

        abort_unless(
            ($user->isParent() && $user->families()->where('families.id', $spender->family_id)->exists())
            || $user->isChildFor($spender),
            403
        );

        $transactions = $account->transactions()
            ->latest('occurred_at')
            ->paginate(50);

        return TransactionResource::collection($transactions)->response();
    }

    public function store(StoreTransactionRequest $request, Account $account): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $transaction = DB::transaction(function () use ($request, $account, $user) {
            $transaction = Transaction::create([
                'account_id' => $account->id,
                'type' => $request->type,
                'amount' => $request->amount,
                'description' => $request->description,
                'image_key' => $request->image_key,
                'occurred_at' => $request->occurred_at,
                'created_by' => $user->id,
            ]);

            $delta = $request->type === 'credit' ? $request->amount : -$request->amount;
            $account->increment('balance', $delta);

            return $transaction;
        });

        return response()->json([
            'data' => new TransactionResource($transaction),
        ], 201);
    }

    public function update(StoreTransactionRequest $request, Account $account, Transaction $transaction): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        DB::transaction(function () use ($request, $account, $transaction) {
            // Revert old impact
            $oldDelta = $transaction->type->value === 'credit' ? -$transaction->amount : $transaction->amount;
            $account->increment('balance', $oldDelta);

            $transaction->update([
                'type' => $request->type,
                'amount' => $request->amount,
                'description' => $request->description,
                'image_key' => $request->image_key,
                'occurred_at' => $request->occurred_at,
            ]);

            // Apply new impact
            $newDelta = $request->type === 'credit' ? $request->amount : -$request->amount;
            $account->increment('balance', $newDelta);
        });

        return response()->json([
            'data' => new TransactionResource($transaction->fresh()),
        ]);
    }

    public function destroy(Request $request, Account $account, Transaction $transaction): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        DB::transaction(function () use ($account, $transaction) {
            $delta = $transaction->type->value === 'credit' ? -$transaction->amount : $transaction->amount;
            $account->increment('balance', $delta);
            $transaction->delete();
        });

        return response()->json(['message' => 'Transaction deleted']);
    }
}
