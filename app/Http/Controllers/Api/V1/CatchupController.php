<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FamilyUser;
use App\Models\PocketMoneyEvent;
use App\Services\CatchupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatchupController extends Controller
{
    public function __construct(private readonly CatchupService $catchupService) {}

    /**
     * Returns catch-up events since last_catchup_at.
     * The UpdateLastCatchupAt middleware updates last_catchup_at after this response is sent.
     */
    public function check(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);

        return response()->json([
            'data' => $this->catchupService->buildForUser($user),
        ]);
    }

    public function release(Request $request, PocketMoneyEvent $event): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);
        $this->authoriseEvent($user->id, $event);

        $updated = $this->catchupService->release($event, $user);

        return response()->json([
            'data' => [
                'id' => $updated->id,
                'status' => $updated->status,
                'transaction_id' => $updated->transaction_id,
            ],
        ]);
    }

    public function reverse(Request $request, PocketMoneyEvent $event): JsonResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);
        $this->authoriseEvent($user->id, $event);

        $updated = $this->catchupService->reverse($event, $user);

        return response()->json([
            'data' => [
                'id' => $updated->id,
                'status' => $updated->status,
                'transaction_id' => $updated->transaction_id,
            ],
        ]);
    }

    private function authoriseEvent(string $userId, PocketMoneyEvent $event): void
    {
        $spender = $event->spender()->firstOrFail();
        abort_unless(
            FamilyUser::where('family_id', $spender->family_id)
                ->where('user_id', $userId)
                ->exists(),
            403
        );
    }
}
