<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Spender;

class SpenderService
{
    public static function mainAccount(Spender $spender): Account
    {
        $account = $spender->accounts()
            ->orderBy('created_at')
            ->firstOrFail();

        /** @var Account $account */
        return $account;
    }
}
