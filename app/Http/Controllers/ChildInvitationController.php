<?php

namespace App\Http\Controllers;

use App\Models\ChildInvitation;
use App\Models\SpenderUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ChildInvitationController extends Controller
{
    /**
     * Accept a child invitation via token link.
     * - Logged in + email matches  → link immediately.
     * - Logged in + wrong email    → error.
     * - Not logged in              → save token in session, redirect to login/register.
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = ChildInvitation::with('spender')->where('token', $token)->first();

        if (!$invitation || $invitation->isExpired()) {
            return redirect()->route('dashboard')
                ->with('error', 'This invitation link is invalid or has expired.');
        }

        $user = $request->user();

        if (!$user) {
            session(['pending_child_invitation' => $token]);
            return redirect()->route('login')
                ->with('status', 'Please log in or create an account to accept your invitation.');
        }

        if (strtolower($user->email) !== strtolower($invitation->email)) {
            return redirect()->route('dashboard')
                ->with('error', "This invitation was sent to {$invitation->email}. Please log in with that account.");
        }

        $this->link($invitation, $user->id);

        /** @var \App\Models\Spender $spender */
        $spender = $invitation->spender;
        return redirect()->route('dashboard')
            ->with('success', "You've been linked to {$spender->name}'s account!");
    }

    /**
     * Cancel a pending invitation. Parent-only — enforced via route middleware.
     */
    public function cancel(ChildInvitation $childInvitation): RedirectResponse
    {
        $childInvitation->delete();
        return back()->with('success', 'Invitation cancelled.');
    }

    /**
     * Called after login or registration to redeem a pending invitation stored in session.
     */
    public static function claimPending(Request $request): void
    {
        $token = session('pending_child_invitation');
        if (!$token) {
            return;
        }

        $invitation = ChildInvitation::with('spender')->where('token', $token)->first();
        $user = $request->user();

        if ($invitation && !$invitation->isExpired() && $user
            && strtolower($user->email) === strtolower($invitation->email)
        ) {
            /** @var \App\Models\Spender $spender */
            $spender = $invitation->spender;
            (new self())->link($invitation, $user->id);
            session()->forget('pending_child_invitation');
            session()->flash('success', "You've been linked to {$spender->name}'s account!");
        } else {
            session()->forget('pending_child_invitation');
        }
    }

    private function link(ChildInvitation $invitation, string $userId): void
    {
        SpenderUser::firstOrCreate([
            'spender_id' => $invitation->spender_id,
            'user_id'    => $userId,
        ]);

        $invitation->delete();
    }
}
