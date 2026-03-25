<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\AnalyticsService;
use Illuminate\Auth\Events\Registered;

class TrackUserRegistered
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function handle(Registered $event): void
    {
        /** @var User $user */
        $user = $event->user;

        $this->analytics->userRegistered($user);
    }
}
