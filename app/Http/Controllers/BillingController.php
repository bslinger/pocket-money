<?php

namespace App\Http\Controllers;

use App\Models\BillingTransferInvitation;
use App\Models\Family;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $families = $user->families()->where('billing_user_id', $user->id)->get();

        /** @var Collection<int, array<string, mixed>> $familyBilling */
        $familyBilling = $families->map(function (Family $family): array {
            $subscription = $family->subscription('default');
            $onTrial = $family->onTrial();

            /** @var BillingTransferInvitation|null $pendingTransfer */
            $pendingTransfer = BillingTransferInvitation::where('family_id', $family->id)
                ->where('expires_at', '>', now())
                ->first();

            /** @var \Illuminate\Database\Eloquent\Collection<int, User> $members */
            $members = $family->users()
                ->where('users.id', '!=', auth()->id())
                ->select(['users.id', 'users.name', 'users.email', 'users.display_name'])
                ->get();

            return [
                'id' => $family->id,
                'name' => $family->name,
                'on_trial' => $onTrial,
                'trial_ends_at' => $onTrial ? $family->trial_ends_at?->toIso8601String() : null,
                'frozen' => ! $family->hasActiveAccess(),
                'members' => $members->map(fn (User $u): array => [
                    'id' => $u->id,
                    'name' => $u->display_name ?? $u->name,
                    'email' => $u->email,
                ]),
                'pending_transfer' => $pendingTransfer ? [
                    'id' => $pendingTransfer->id,
                    'to_email' => $pendingTransfer->to_email,
                    'expires_at' => $pendingTransfer->expires_at->toIso8601String(),
                ] : null,
                'subscription' => $subscription ? [
                    'status' => $subscription->stripe_status,
                    'plan_name' => $subscription->stripe_price === config('services.stripe.price_yearly')
                        ? 'Annual' : 'Monthly',
                    'current_period_end' => $subscription->ends_at?->toIso8601String(),
                    'cancel_at_period_end' => $subscription->canceled(),
                ] : null,
            ];
        });

        return Inertia::render('Billing/Index', [
            'families' => $familyBilling,
            'prices' => [
                'monthly' => [
                    'amount' => '$1.99',
                    'interval' => 'month',
                    'configured' => ! empty(config('services.stripe.price_monthly')),
                ],
                'yearly' => [
                    'amount' => '$15',
                    'interval' => 'year',
                    'savings' => '37%',
                    'configured' => ! empty(config('services.stripe.price_yearly')),
                ],
            ],
        ]);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:monthly,yearly',
            'family_id' => 'required|string',
        ]);

        $family = auth()->user()->families()
            ->where('families.id', $request->input('family_id'))
            ->where('billing_user_id', auth()->id())
            ->firstOrFail();

        $priceId = $request->input('plan') === 'yearly'
            ? config('services.stripe.price_yearly')
            : config('services.stripe.price_monthly');

        abort_unless($priceId, 500, 'Stripe price not configured.');

        return $family->newSubscription('default', $priceId)
            ->allowPromotionCodes()
            ->checkout([
                'success_url' => route('billing').'?checkout=success',
                'cancel_url' => route('billing').'?checkout=cancelled',
            ]);
    }

    public function portal(Request $request)
    {
        $request->validate([
            'family_id' => 'required|string',
        ]);

        $family = auth()->user()->families()
            ->where('families.id', $request->input('family_id'))
            ->where('billing_user_id', auth()->id())
            ->firstOrFail();

        return $family->redirectToBillingPortal(route('billing'));
    }
}
