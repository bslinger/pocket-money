<?php

namespace App\Services;

use App\Models\User;
use PostHog\PostHog;

class AnalyticsService
{
    private bool $enabled;

    public function __construct()
    {
        $this->enabled = (bool) config('posthog.enabled') && ! empty(config('posthog.api_key'));

        if ($this->enabled) {
            PostHog::init(config('posthog.api_key'), [
                'host' => config('posthog.host'),
            ]);
        }
    }

    public function capture(string $distinctId, string $event, array $properties = []): void
    {
        if (! $this->enabled) {
            return;
        }

        $environment = config('app.env');

        rescue(fn () => PostHog::capture([
            'distinctId' => $distinctId,
            'event' => $event,
            'properties' => array_merge(
                ['environment' => $environment, '$set' => ['environment' => $environment]],
                $properties,
            ),
        ]));
    }

    public function captureForUser(User $user, string $event, array $properties = []): void
    {
        $this->capture($user->id, $event, $properties);
    }

    public function crudEvent(User $user, string $entity, string $action, array $properties = []): void
    {
        $this->captureForUser($user, "{$entity}_{$action}", $properties);
    }

    public function userRegistered(User $user): void
    {
        $this->captureForUser($user, 'user_registered');
    }

    public function userLoggedIn(User $user, string $source = 'web'): void
    {
        $this->captureForUser($user, 'user_logged_in', ['source' => $source]);
    }

    public function userLoggedOut(User $user, string $source = 'web'): void
    {
        $this->captureForUser($user, 'user_logged_out', ['source' => $source]);
    }

    public function onboardingCompleted(User $user, int $spenderCount): void
    {
        $this->captureForUser($user, 'onboarding_completed', [
            'spender_count' => $spenderCount,
        ]);
    }

    public function choreApproved(User $user, string $rewardType): void
    {
        $this->captureForUser($user, 'chore_approved', [
            'reward_type' => $rewardType,
        ]);
    }

    public function choreDeclined(User $user): void
    {
        $this->captureForUser($user, 'chore_declined');
    }

    public function pocketMoneyReleased(string $distinctId, int $spenderCount): void
    {
        $this->capture($distinctId, 'pocket_money_released', [
            'spender_count' => $spenderCount,
        ]);
    }

    public function subscriptionStarted(string $distinctId, string $plan): void
    {
        $this->capture($distinctId, 'subscription_started', [
            'plan' => $plan,
        ]);
    }

    public function subscriptionCancelled(string $distinctId, string $plan): void
    {
        $this->capture($distinctId, 'subscription_cancelled', [
            'plan' => $plan,
        ]);
    }
}
