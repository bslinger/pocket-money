<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFamilyRequest;
use App\Http\Resources\FamilyResource;
use App\Models\Account;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\Spender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $families = $request->user()->families()
            ->with(['familyUsers.user', 'spenders'])
            ->get();

        return response()->json([
            'data' => FamilyResource::collection($families),
        ]);
    }

    public function show(Family $family, Request $request): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $family->id)->exists(), 403);

        $family->load(['familyUsers.user', 'spenders.accounts']);

        return response()->json([
            'data' => new FamilyResource($family),
        ]);
    }

    public function store(StoreFamilyRequest $request): JsonResponse
    {
        $user = $request->user();

        $family = Family::create($request->safe()->except('spenders'));

        FamilyUser::create([
            'family_id' => $family->id,
            'user_id' => $user->id,
            'role' => 'admin',
        ]);

        $family->grantTrialIfEligible($user);

        if ($request->has('spenders')) {
            foreach ($request->input('spenders', []) as $spenderData) {
                $spender = Spender::create([
                    'family_id' => $family->id,
                    'name' => $spenderData['name'],
                    'color' => $spenderData['color'] ?? null,
                ]);

                Account::create([
                    'spender_id' => $spender->id,
                    'name' => 'Savings',
                    'balance' => $spenderData['balance'] ?? 0,
                ]);
            }
        }

        $family->load(['familyUsers.user', 'spenders.accounts']);

        return response()->json([
            'data' => new FamilyResource($family),
        ], 201);
    }

    public function update(StoreFamilyRequest $request, Family $family): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $family->id)->exists(), 403);

        $family->update($request->safe()->except('spenders'));

        return response()->json([
            'data' => new FamilyResource($family->fresh()),
        ]);
    }

    public function switchActive(Request $request, Family $family): JsonResponse
    {
        abort_unless($request->user()->families()->where('families.id', $family->id)->exists(), 403);

        return response()->json([
            'data' => new FamilyResource($family),
            'message' => 'Active family switched',
        ]);
    }
}
