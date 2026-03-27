<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\FamilyLinkCode;
use App\Models\FamilyScreenLinkCode;
use App\Models\Spender;
use App\Models\SpenderLinkCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CodeLookupController extends Controller
{
    /**
     * Identify a code without consuming it.
     * Returns the code type and enough preview info for the mobile app
     * to show the appropriate confirmation UI before claiming.
     */
    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $code = strtoupper($request->string('code')->toString());

        $spenderCode = SpenderLinkCode::where('code', $code)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->with('spender.family')
            ->first();

        if ($spenderCode) {
            /** @var Spender $spender */
            $spender = $spenderCode->spender;

            /** @var Family $spenderFamily */
            $spenderFamily = $spender->family;

            return response()->json([
                'data' => [
                    'type' => 'spender',
                    'spender_name' => $spender->name,
                    'family_name' => $spenderFamily->name,
                ],
            ]);
        }

        $familyCode = FamilyLinkCode::where('code', $code)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->with('family')
            ->first();

        if ($familyCode) {
            /** @var Family $family */
            $family = $familyCode->family;

            return response()->json([
                'data' => [
                    'type' => 'family',
                    'family_name' => $family->name,
                ],
            ]);
        }

        $familyScreenCode = FamilyScreenLinkCode::where('code', $code)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->with('family')
            ->first();

        if ($familyScreenCode) {
            /** @var Family $screenFamily */
            $screenFamily = $familyScreenCode->family;

            return response()->json([
                'data' => [
                    'type' => 'family_screen',
                    'family_name' => $screenFamily->name,
                ],
            ]);
        }

        return response()->json(['message' => 'Invalid or expired code.'], 422);
    }
}
