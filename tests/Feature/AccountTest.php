<?php

use App\Models\Account;

describe('accounts', function () {

    describe('create / store', function () {
        it('creates an account for a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('accounts.store'), [
                    'spender_id'    => $spender->id,
                    'name'          => 'Spending',
                    'is_savings_pot' => false,
                ])
                ->assertRedirect();

            $account = Account::where('spender_id', $spender->id)->first();
            expect($account)->not->toBeNull();
            expect((float) $account->balance)->toBe(0.0);
        });

        it('creates a savings pot account', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('accounts.store'), [
                    'spender_id'    => $spenders->first()->id,
                    'name'          => 'Savings',
                    'is_savings_pot' => true,
                ])
                ->assertRedirect();

            expect(Account::where('is_savings_pot', true)->exists())->toBeTrue();
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
