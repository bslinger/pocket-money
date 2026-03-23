<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransferRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferController extends Controller
{
    public function store(StoreTransferRequest $request, Account $account): JsonResponse
    {
        $user = $request->user();
        $spender = $account->spender;

        abort_unless(
            ($user->isParent() && $user->families()->where('families.id', $spender->family_id)->exists())
            || $user->isChildFor($spender),
            403
        );

        $toAccount = Account::findOrFail($request->to_account_id);

        abort_unless($toAccount->spender_id === $account->spender_id, 422, 'Accounts must belong to the same spender');
        abort_unless($toAccount->currency_symbol === $account->currency_symbol, 422, 'Currency must match');

        $transferGroupId = (string) Str::uuid();

        $transactions = DB::transaction(function () use ($request, $account, $toAccount, $transferGroupId, $user) {
            $debit = Transaction::create([
                'account_id' => $account->id,
                'type' => 'debit',
                'amount' => $request->amount,
                'description' => $request->description ?? 'Transfer',
                'transfer_group_id' => $transferGroupId,
                'occurred_at' => now(),
                'created_by' => $user->id,
            ]);

            $credit = Transaction::create([
                'account_id' => $toAccount->id,
                'type' => 'credit',
                'amount' => $request->amount,
                'description' => $request->description ?? 'Transfer',
                'transfer_group_id' => $transferGroupId,
                'occurred_at' => now(),
                'created_by' => $user->id,
            ]);

            $account->decrement('balance', $request->amount);
            $toAccount->increment('balance', $request->amount);

            return [$debit, $credit];
        });

        return response()->json([
            'data' => TransactionResource::collection($transactions),
        ], 201);
    }
}
