<?php

namespace App\Http\Controllers;

use App\Models\Family;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $families = $user->families()->where('billing_user_id', $user->id)->get();

        $familyBilling = $families->map(function (Family $family) {
            $subscription = $family->subscription('default');
            $onTrial = $family->onTrial();

            return [
                'id' => $family->id,
                'name' => $family->name,
                'on_trial' => $onTrial,
                'trial_ends_at' => $onTrial ? $family->trial_ends_at->toIso8601String() : null,
                'frozen' => ! $family->hasActiveAccess(),
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
