<?php

namespace App\Http\Controllers;

use App\Models\FamilyUser;
use App\Models\PocketMoneyEvent;
use App\Services\CatchupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CatchupController extends Controller
{
    public function __construct(private readonly CatchupService $catchupService) {}

    public function release(Request $request, PocketMoneyEvent $event): RedirectResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);
        $this->authoriseEvent($user->id, $event);

        $this->catchupService->release($event, $user);

        return back();
    }

    public function reverse(Request $request, PocketMoneyEvent $event): RedirectResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);
        $this->authoriseEvent($user->id, $event);

        $this->catchupService->reverse($event, $user);

        return back();
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
