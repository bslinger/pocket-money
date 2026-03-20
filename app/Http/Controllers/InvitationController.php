<?php

namespace App\Http\Controllers;

use App\Enums\FamilyRole;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\Invitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    /**
     * Accept a family invitation via token link.
     * - If the user is logged in and their email matches the invite, add them directly.
     * - If the user is logged in but email doesn't match, show an error.
     * - If not logged in, save the token in session and redirect to login.
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = Invitation::with('family')->where('token', $token)->first();

        if (!$invitation || $invitation->isExpired()) {
            return redirect()->route('dashboard')
                ->with('error', 'This invitation link is invalid or has expired.');
        }

        $user = $request->user();

        if (!$user) {
            // Save token in session, redirect to login
            session(['pending_invitation_token' => $token]);
            return redirect()->route('login')
                ->with('status', 'Please log in (or register) to accept your invitation.');
        }

        if (strtolower($user->email) !== strtolower($invitation->email)) {
            return redirect()->route('dashboard')
                ->with('error', "This invitation was sent to {$invitation->email}. Please log in with that account.");
        }

        /** @var Family $family */
        $family = $invitation->family;
        $this->addToFamily($invitation, $user->id);

        return redirect()->route('dashboard')
            ->with('success', "Welcome to {$family->name}!");
    }

    /** Called after login/register when a pending_invitation_token is in session. */
    public static function claimPending(Request $request): void
    {
        $token = session('pending_invitation_token');
        if (!$token) {
            return;
        }

        /** @var \App\Models\Invitation|null $invitation */
        $invitation = Invitation::with('family')->where('token', $token)->first();
        $user = $request->user();

        if ($invitation && !$invitation->isExpired() && $user
            && strtolower($user->email) === strtolower($invitation->email)) {
            /** @var Family $family */
            $family = $invitation->family;
            (new self())->addToFamily($invitation, $user->id);
            session()->forget('pending_invitation_token');
            session()->flash('success', "You've joined {$family->name}!");
        } else {
            session()->forget('pending_invitation_token');
        }
    }

    private function addToFamily(Invitation $invitation, string $userId): void
    {
        FamilyUser::firstOrCreate(
            ['family_id' => $invitation->family_id, 'user_id' => $userId],
            ['role'      => FamilyRole::Member],
        );

        $invitation->delete();
    }
}
