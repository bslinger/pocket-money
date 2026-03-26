<?php

namespace App\Listeners;

use App\Models\User;
use Bentonow\BentoLaravel\DataTransferObjects\EventData;
use Bentonow\BentoLaravel\Facades\Bento;
use Illuminate\Auth\Events\Registered;

class SyncUserToBento
{
    public function handle(Registered $event): void
    {
        if (! app()->isProduction()) {
            return;
        }

        /** @var User $user */
        $user = $event->user;

        rescue(function () use ($user): void {
            Bento::trackEvent(collect([
                new EventData(
                    type: '$created_account',
                    email: $user->email,
                    fields: [
                        'first_name' => $user->name,
                    ],
                ),
            ]));
        });
    }
}
