<?php

namespace App\Listeners;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Http;

class SyncUserToLoops
{
    public function handle(Registered $event): void
    {
        if (! app()->isProduction()) {
            return;
        }

        /** @var User $user */
        $user = $event->user;

        rescue(function () use ($user): void {
            Http::withToken(config('services.loops.api_key'))
                ->post('https://app.loops.so/api/v1/contacts/create', [
                    'email' => $user->email,
                    'firstName' => $user->name,
                    'source' => 'registration',
                    'userGroup' => 'registered',
                ]);
        });
    }
}
