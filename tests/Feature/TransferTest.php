<?php

use App\Models\Account;
use App\Models\Transaction;

describe('transfers', function () {
    it('transfers money between two accounts in the same family', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $from = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 20]);
        $to   = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $this->actingAs($user)
            ->post(route('accounts.transfer', $from), [
                'to_account_id' => $to->id,
                'amount'        => '8.00',
                'description'   => 'Moving to savings',
            ])
            ->assertRedirect();

        expect((float) $from->fresh()->balance)->toBe(12.0);
        expect((float) $to->fresh()->balance)->toBe(8.0);
    });

    it('creates paired debit/credit transactions with the same transfer_group_id', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $from = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 50]);
        $to   = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $this->actingAs($user)
            ->post(route('accounts.transfer', $from), [
                'to_account_id' => $to->id,
                'amount'        => '15.00',
                'description'   => 'Transfer',
            ]);

        $debit  = Transaction::where('account_id', $from->id)->first();
        $credit = Transaction::where('account_id', $to->id)->first();

        expect($debit->transfer_group_id)->toBe($credit->transfer_group_id);
        expect($debit->type->value)->toBe('debit');
        expect($credit->type->value)->toBe('credit');
        expect((float) $debit->amount)->toBe(15.0);
        expect((float) $credit->amount)->toBe(15.0);
    });

    it('forbids a user from a different family transferring', function () {
        [$_user, , $spenders] = parentWithFamily(['Emma']);
        [$otherUser]     = parentWithFamily();
        $spender = $spenders->first();
        $from = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 20]);
        $to   = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $this->actingAs($otherUser)
            ->post(route('accounts.transfer', $from), [
                'to_account_id' => $to->id,
                'amount'        => '5.00',
            ])
            ->assertForbidden();
    });

    it('rejects transfers between accounts of different kids', function () {
        [$user, , $spenders] = parentWithFamily(['Emma', 'Jack']);
        $from = Account::factory()->create(['spender_id' => $spenders[0]->id, 'balance' => 20]);
        $to   = Account::factory()->create(['spender_id' => $spenders[1]->id, 'balance' => 0]);

        $this->actingAs($user)
            ->post(route('accounts.transfer', $from), [
                'to_account_id' => $to->id,
                'amount'        => '5.00',
            ])
            ->assertStatus(422);
    });

    it('rejects transfers between accounts with different currencies', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $from = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 20, 'currency_symbol' => null]);
        $to   = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0, 'currency_symbol' => '⭐']);

        $this->actingAs($user)
            ->post(route('accounts.transfer', $from), [
                'to_account_id' => $to->id,
                'amount'        => '5.00',
            ])
            ->assertStatus(422);
    });

    it('shows only same-spender same-currency accounts on the transfer create page', function () {
        [$user, , $spenders] = parentWithFamily(['Emma', 'Jack']);
        $spender = $spenders->first();
        $otherSpender = $spenders->last();

        $from       = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 20, 'currency_symbol' => null]);
        $compatible = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0, 'currency_symbol' => null]);
        Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0, 'currency_symbol' => '⭐']); // different currency
        Account::factory()->create(['spender_id' => $otherSpender->id, 'balance' => 0, 'currency_symbol' => null]); // different kid

        $this->actingAs($user)
            ->get(route('accounts.transfer.create', $from))
            ->assertInertia(fn ($page) => $page
                ->has('accounts', 1)
                ->where('accounts.0.id', $compatible->id)
            );
    });

    it('validates amount is required', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $from = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 20]);
        $to   = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $this->actingAs($user)
            ->post(route('accounts.transfer', $from), ['to_account_id' => $to->id])
            ->assertSessionHasErrors('amount');
    });
});
