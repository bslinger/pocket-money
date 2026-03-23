<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\BillingTransferController;
use App\Http\Controllers\ChildInvitationController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\InvitationController;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_if($user === null, 401);

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Claim any pending invitations now that the email is verified
        InvitationController::claimPending($request);
        ChildInvitationController::claimPending($request);
        BillingTransferController::claimPending($request);

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
