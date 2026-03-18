<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function index()
    {
        $family = auth()->user()->families()->first();

        return Inertia::render('Billing/Index', [
            'subscription' => $family?->subscription('default'),
        ]);
    }

    public function checkout(Request $request)
    {
        $user = auth()->user();
        $family = $user->families()->firstOrFail();

        return $family->newSubscription('default', config('services.stripe.price_monthly'))
            ->checkout([
                'success_url' => route('billing'),
                'cancel_url'  => route('billing'),
            ]);
    }

    public function portal(Request $request)
    {
        $family = auth()->user()->families()->firstOrFail();

        return $family->redirectToBillingPortal(route('billing'));
    }
}
