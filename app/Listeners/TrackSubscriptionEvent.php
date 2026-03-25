<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\AnalyticsService;
use Laravel\Cashier\Events\WebhookReceived;

class TrackSubscriptionEvent
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function handle(WebhookReceived $event): void
    {
        $type = $event->payload['type'] ?? null;
        $object = $event->payload['data']['object'] ?? [];

        if ($type === 'customer.subscription.created') {
            $this->handleSubscriptionCreated($object);
        } elseif ($type === 'customer.subscription.deleted') {
            $this->handleSubscriptionDeleted($object);
        }
    }

    /** @param array<string, mixed> $subscription */
    private function handleSubscriptionCreated(array $subscription): void
    {
        $stripeCustomerId = $subscription['customer'] ?? null;
        if (! $stripeCustomerId) {
            return;
        }

        $user = User::where('stripe_id', $stripeCustomerId)->first();
        if (! $user) {
            return;
        }

        $plan = $this->resolvePlan($subscription);

        $this->analytics->subscriptionStarted($user->id, $plan);
    }

    /** @param array<string, mixed> $subscription */
    private function handleSubscriptionDeleted(array $subscription): void
    {
        $stripeCustomerId = $subscription['customer'] ?? null;
        if (! $stripeCustomerId) {
            return;
        }

        $user = User::where('stripe_id', $stripeCustomerId)->first();
        if (! $user) {
            return;
        }

        $plan = $this->resolvePlan($subscription);

        $this->analytics->subscriptionCancelled($user->id, $plan);
    }

    /** @param array<string, mixed> $subscription */
    private function resolvePlan(array $subscription): string
    {
        $priceId = data_get($subscription, 'items.data.0.price.id');

        if ($priceId === config('services.stripe.price_yearly')) {
            return 'yearly';
        }

        if ($priceId === config('services.stripe.price_monthly')) {
            return 'monthly';
        }

        return 'unknown';
    }
}
