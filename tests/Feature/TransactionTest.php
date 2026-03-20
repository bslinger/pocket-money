<?php

use App\Models\Account;
use App\Models\Transaction;
use App\Enums\TxType;

describe('transactions', function () {

    describe('store', function () {
        it('creates a credit transaction and increments balance', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => 0]);

            $this->actingAs($user)
                ->post(route('accounts.transactions.store', $account), [
                    'type'        => 'credit',
                    'amount'      => '10.00',
                    'description' => 'Birthday money',
                    'occurred_at' => now()->toDateString(),
                ])
                ->assertRedirect();

            expect((float) $account->fresh()->balance)->toBe(10.0);
            expect(Transaction::where('account_id', $account->id)->where('type', TxType::Credit)->exists())->toBeTrue();
        });

        it('creates a debit transaction and decrements balance', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => 20]);

            $this->actingAs($user)
                ->post(route('accounts.transactions.store', $account), [
                    'type'        => 'debit',
                    'amount'      => '5.00',
                    'description' => 'Sweets',
                    'occurred_at' => now()->toDateString(),
                ])
                ->assertRedirect();

            expect((float) $account->fresh()->balance)->toBe(15.0);
        });

        it('validates amount is required', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('accounts.transactions.store', $account), [
                    'type'        => 'credit',
                    'occurred_at' => now()->toDateString(),
                ])
                ->assertSessionHasErrors('amount');
        });

        it('validates type is required', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('accounts.transactions.store', $account), [
                    'amount'      => '5.00',
                    'occurred_at' => now()->toDateString(),
                ])
                ->assertSessionHasErrors('type');
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $account  = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->post(route('accounts.transactions.store', $account), [
                    'type' => 'credit', 'amount' => '5.00', 'occurred_at' => now()->toDateString(),
                ])
                ->assertForbidden();
        });
    });

    describe('update', function () {
        it('updates a transaction and recalculates balance', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => 10]);
            $tx = Transaction::factory()->credit()->create(['account_id' => $account->id, 'amount' => 10]);

            // Change credit $10 → debit $3: net change is -$13
            $this->actingAs($user)
                ->patch(route('accounts.transactions.update', [$account, $tx]), [
                    'type'        => 'debit',
                    'amount'      => '3.00',
                    'description' => 'Updated',
                    'occurred_at' => now()->toDateString(),
                ])
                ->assertRedirect();

            expect((float) $account->fresh()->balance)->toBe(-3.0);
            expect($tx->fresh()->type)->toBe(TxType::Debit);
        });
    });

    describe('destroy', function () {
        it('deletes a credit transaction and decrements balance', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => 15]);
            $tx = Transaction::factory()->credit()->create(['account_id' => $account->id, 'amount' => 15]);

            $this->actingAs($user)
                ->delete(route('accounts.transactions.destroy', [$account, $tx]))
                ->assertRedirect();

            expect((float) $account->fresh()->balance)->toBe(0.0);
            expect(Transaction::find($tx->id))->toBeNull();
        });

        it('deletes a debit transaction and increments balance', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => 5]);
            $tx = Transaction::factory()->debit()->create(['account_id' => $account->id, 'amount' => 10]);

            $this->actingAs($user)
                ->delete(route('accounts.transactions.destroy', [$account, $tx]))
                ->assertRedirect();

            expect((float) $account->fresh()->balance)->toBe(15.0);
        });
    });
});
