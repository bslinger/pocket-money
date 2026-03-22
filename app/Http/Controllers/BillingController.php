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
        $family = $this->activeFamily();
        $subscription = $family?->subscription('default');
        $onTrial = $family?->onTrial() ?? false;

        return Inertia::render('Billing/Index', [
            'subscription' => $subscription ? [
                'status' => $subscription->stripe_status,
                'plan_name' => $subscription->stripe_price === config('services.stripe.price_yearly')
                    ? 'Annual' : 'Monthly',
                'current_period_end' => $subscription->ends_at?->toIso8601String(),
                'cancel_at_period_end' => $subscription->canceled(),
                'on_grace_period' => $subscription->onGracePeriod(),
            ] : null,
            'on_trial' => $onTrial,
            'trial_ends_at' => $onTrial ? $family->trial_ends_at->toIso8601String() : null,
            'frozen' => $family && ! $family->hasActiveAccess(),
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
        ]);

        $family = $this->activeFamily();
        abort_unless($family !== null, 404);

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

    public function portal()
    {
        $family = $this->activeFamily();
        abort_unless($family !== null, 404);

        return $family->redirectToBillingPortal(route('billing'));
    }

    private function activeFamily(): ?Family
    {
        $user = auth()->user();
        $familyId = session('active_family_id');

        if ($familyId) {
            return Family::find($familyId);
        }

        return $user->families()->first();
    }
}
