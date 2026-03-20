<?php

use App\Models\Account;
use App\Models\Spender;
use App\Models\Family;
use App\Services\SpenderService;

describe('SpenderService::mainAccount', function () {
    it('returns the first account by creation order', function () {
        $family  = Family::factory()->create();
        $spender = Spender::factory()->create(['family_id' => $family->id]);
        $first   = Account::factory()->create(['spender_id' => $spender->id]);
        Account::factory()->create(['spender_id' => $spender->id]);

        $result = SpenderService::mainAccount($spender);

        expect($result->id)->toBe($first->id);
    });

    it('throws if the spender has no accounts', function () {
        $family  = Family::factory()->create();
        $spender = Spender::factory()->create(['family_id' => $family->id]);

        expect(fn() => SpenderService::mainAccount($spender))
            ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
    });
});
