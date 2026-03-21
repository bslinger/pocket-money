<?php

use App\Models\Account;

describe('accounts', function () {

    describe('create / store', function () {
        it('creates an account for a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('accounts.store'), [
                    'spender_id' => $spender->id,
                    'name'       => 'Spending',
                ])
                ->assertRedirect();

            $account = Account::where('spender_id', $spender->id)->first();
            expect($account)->not->toBeNull();
            expect((float) $account->balance)->toBe(0.0);
        });

        it('creates an account with custom currency settings', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('accounts.store'), [
                    'spender_id'          => $spender->id,
                    'name'                => 'Star Bucks',
                    'currency_symbol'     => '⭐',
                    'currency_name'       => 'Star',
                    'currency_name_plural' => 'Stars',
                    'use_integer_amounts' => true,
                ])
                ->assertRedirect();

            $account = Account::where('spender_id', $spender->id)->first();
            expect($account)->not->toBeNull();
            expect($account->currency_symbol)->toBe('⭐');
            expect($account->currency_name)->toBe('Star');
            expect($account->use_integer_amounts)->toBeTrue();
        });

        it('validates that name is required', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('accounts.store'), ['spender_id' => $spenders->first()->id])
                ->assertSessionHasErrors('name');
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->post(route('accounts.store'), ['spender_id' => $spenders->first()->id, 'name' => 'X'])
                ->assertForbidden();
        });
    });

    describe('show', function () {
        it('shows account with transactions', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->get(route('accounts.show', $account))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Accounts/Show'));
        });
    });

    describe('update', function () {
        it('renames an account', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->patch(route('accounts.update', $account), ['name' => 'New Name'])
                ->assertRedirect();

            expect($account->fresh()->name)->toBe('New Name');
        });
    });

    describe('destroy', function () {
        it('deletes an account and redirects to the spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->delete(route('accounts.destroy', $account))
                ->assertRedirect();

            expect(Account::find($account->id))->toBeNull();
        });
    });
});
