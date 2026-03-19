<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Spender;

class SpenderService
{
    public static function mainAccount(Spender $spender): Account
    {
        return $spender->accounts()
            ->where('is_savings_pot', false)
            ->orderBy('created_at')
            ->firstOr(fn() => $spender->accounts()->orderBy('created_at')->firstOrFail());
    }
}
