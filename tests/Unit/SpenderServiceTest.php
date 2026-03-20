<?php

use App\Models\Account;
use App\Models\Spender;
use App\Models\Family;
use App\Services\SpenderService;

describe('SpenderService::mainAccount', function () {
    it('returns the first non-savings-pot account', function () {
        $family  = Family::factory()->create();
        $spender = Spender::factory()->create(['family_id' => $family->id]);
        $savings = Account::factory()->savingsPot()->create(['spender_id' => $spender->id]);
        $main    = Account::factory()->create(['spender_id' => $spender->id, 'is_savings_pot' => false]);

        $result = SpenderService::mainAccount($spender);

        expect($result->id)->toBe($main->id);
    });

    it('falls back to any account if all are savings pots', function () {
        $family  = Family::factory()->create();
        $spender = Spender::factory()->create(['family_id' => $family->id]);
        $savings = Account::factory()->savingsPot()->create(['spender_id' => $spender->id]);

        $result = SpenderService::mainAccount($spender);

        expect($result->id)->toBe($savings->id);
    });

    it('throws if the spender has no accounts', function () {
        $family  = Family::factory()->create();
        $spender = Spender::factory()->create(['family_id' => $family->id]);

        expect(fn() => SpenderService::mainAccount($spender))
            ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
    });
});
