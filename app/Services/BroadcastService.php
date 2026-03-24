<?php

namespace App\Services;

use App\Events\FamilyUpdated;
use App\Events\SpenderUpdated;
use App\Models\Family;
use App\Models\Spender;

class BroadcastService
{
    public static function familyUpdated(Family $family): void
    {
        rescue(fn () => broadcast(new FamilyUpdated($family)));
    }

    public static function spenderUpdated(Spender $spender): void
    {
        rescue(fn () => broadcast(new SpenderUpdated($spender)));
    }
}
