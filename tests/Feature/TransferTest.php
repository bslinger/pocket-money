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
