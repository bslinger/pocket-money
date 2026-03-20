<?php

use App\Models\Account;
use App\Models\Transaction;
use App\Models\RecurringTransaction;
use App\Enums\Frequency;

describe('pocket money release', function () {

    it('shows the release page with spenders', function () {
        [$user] = parentWithFamily(['Emma', 'Jack']);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('PocketMoney/Release')
                ->has('spenders', 2)
            );
    });

    it('calculates weekly_amount from active weekly recurring credits', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        RecurringTransaction::factory()->weekly(5.00)->create(['account_id' => $account->id]);
        RecurringTransaction::factory()->weekly(3.00)->create(['account_id' => $account->id]);
        // Inactive one should not count
        RecurringTransaction::factory()->weekly(10.00)->inactive()->create(['account_id' => $account->id]);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertInertia(fn($page) =>
                $page->where('spenders.0.weekly_amount', '8.00')
            );
    });

    it('pays pocket money and credits the main account', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0, 'is_savings_pot' => false]);

        $this->actingAs($user)
            ->post(route('pocket-money.pay'), [
                'spender_id' => $spender->id,
                'amount'     => '5.00',
            ])
            ->assertRedirect();

        expect((float) $account->fresh()->balance)->toBe(5.0);

        $tx = Transaction::where('account_id', $account->id)->first();
        expect($tx->description)->toBe('Pocket money');
        expect($tx->type->value)->toBe('credit');
    });

    it('validates amount must be at least 0.01', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);

        $this->actingAs($user)
            ->post(route('pocket-money.pay'), [
                'spender_id' => $spenders->first()->id,
                'amount'     => '0',
            ])
            ->assertSessionHasErrors('amount');
    });

    it('requires parent role', function () {
        [$_user, , $spenders] = parentWithFamily(['Emma']);
        $child = childLinkedTo($spenders->first());

        $this->actingAs($child)
            ->post(route('pocket-money.pay'), ['spender_id' => $spenders->first()->id, 'amount' => '5.00'])
            ->assertForbidden();
    });
});
