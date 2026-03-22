<?php

namespace App\Http\Controllers;

use App\Mail\BillingTransferMail;
use App\Models\BillingTransferInvitation;
use App\Models\Family;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BillingTransferController extends Controller
{
    /**
     * Initiate a billing transfer — sends an email to the target user.
     */
    public function initiate(Request $request, Family $family): RedirectResponse
    {
        $user = $request->user();

        abort_unless($family->isBillingUser($user), 403, 'Only the billing owner can transfer billing.');

        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = $request->input('email');

        // Can't transfer to yourself
        if (strtolower($email) === strtolower($user->email)) {
            return back()->withErrors(['email' => 'You are already the billing owner.']);
        }

        // Must be a member of the family
        $isMember = $family->users()
            ->where('users.email', $email)
            ->exists();

        if (! $isMember) {
            return back()->withErrors(['email' => 'This person must be a member of the family first.']);
        }

        // Create or refresh the invitation
        $invitation = BillingTransferInvitation::updateOrCreate(
            ['family_id' => $family->id, 'to_email' => strtolower($email)],
            [
                'from_user_id' => $user->id,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(7),
            ]
        );
        $invitation->load(['family', 'fromUser']);

        Mail::to($email)->send(new BillingTransferMail($invitation));

        return back()->with('success', "Billing transfer invitation sent to {$email}.");
    }

    /**
     * Accept a billing transfer via token link.
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = BillingTransferInvitation::with('family')
            ->where('token', $token)
            ->first();

        if (! $invitation || $invitation->isExpired()) {
            return redirect()->route('billing')
                ->with('error', 'This billing transfer link is invalid or has expired.');
        }

        $user = $request->user();

        if (! $user) {
            session(['pending_billing_transfer_token' => $token]);

            return redirect()->route('login')
                ->with('status', 'Please log in to accept the billing transfer.');
        }

        if (strtolower($user->email) !== strtolower($invitation->to_email)) {
            return redirect()->route('billing')
                ->with('error', "This transfer was sent to {$invitation->to_email}. Please log in with that account.");
        }

        // Transfer billing ownership
        /** @var Family $family */
        $family = $invitation->family;
        $family->update(['billing_user_id' => $user->id]);
        $invitation->delete();

        return redirect()->route('billing')
            ->with('success', "You are now the billing owner for {$family->name}.");
    }

    /**
     * Cancel a pending billing transfer.
     */
    public function cancel(BillingTransferInvitation $invitation): RedirectResponse
    {
        $user = auth()->user();
        abort_unless($invitation->from_user_id === $user->id, 403);

        $invitation->delete();

        return back()->with('success', 'Billing transfer invitation cancelled.');
    }

    /**
     * Claim a pending billing transfer after login (called from AuthenticatedSessionController).
     */
    public static function claimPending(Request $request): void
    {
        $token = session('pending_billing_transfer_token');
        if (! $token) {
            return;
        }

        $invitation = BillingTransferInvitation::with('family')
            ->where('token', $token)
            ->first();
        $user = $request->user();

        if ($invitation && ! $invitation->isExpired() && $user
            && strtolower($user->email) === strtolower($invitation->to_email)) {
            /** @var Family $family */
            $family = $invitation->family;
            $family->update(['billing_user_id' => $user->id]);
            $invitation->delete();
            session()->forget('pending_billing_transfer_token');
            session()->flash('success', "You are now the billing owner for {$family->name}.");
        } else {
            session()->forget('pending_billing_transfer_token');
        }
    }
}
