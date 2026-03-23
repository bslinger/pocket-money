<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function show(Request $request, Account $account): JsonResponse
    {
        $user = $request->user();
        $spender = $account->spender;

        abort_unless(
            ($user->isParent() && $user->families()->where('families.id', $spender->family_id)->exists())
            || $user->isChildFor($spender),
            403
        );

        $account->load(['spender.family', 'transactions' => fn ($q) => $q->latest('occurred_at')->limit(50)]);

        return response()->json([
            'data' => new AccountResource($account),
        ]);
    }

    public function store(Request $request, StoreAccountRequest $accountRequest): JsonResponse
    {
        $spenderId = $request->input('spender_id');

        $account = Account::create([
            'spender_id' => $spenderId,
            ...$accountRequest->validated(),
        ]);

        return response()->json([
            'data' => new AccountResource($account),
        ], 201);
    }

    public function update(StoreAccountRequest $request, Account $account): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $account->update($request->validated());

        return response()->json([
            'data' => new AccountResource($account->fresh()),
        ]);
    }

    public function destroy(Request $request, Account $account): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->families()->where('families.id', $account->spender->family_id)->exists(), 403);

        $account->delete();

        return response()->json(['message' => 'Account deleted']);
    }
}
