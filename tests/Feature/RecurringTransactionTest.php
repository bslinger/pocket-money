<?php

use App\Models\Account;
use App\Models\RecurringTransaction;

describe('recurring transactions', function () {

    describe('store', function () {
        it('creates a recurring transaction for an account', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('accounts.recurring.store', $account), [
                    'type' => 'credit',
                    'amount' => '5.00',
                    'description' => 'Pocket money',
                    'frequency' => 'weekly',
                    'next_run_at' => now()->addWeek()->toDateTimeString(),
                ])
                ->assertRedirect(route('accounts.recurring.index', $account));

            expect(RecurringTransaction::where('account_id', $account->id)->exists())->toBeTrue();
        });

        it('validates required fields', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('accounts.recurring.store', $account), [])
                ->assertSessionHasErrors(['type', 'amount', 'frequency', 'next_run_at']);
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->post(route('accounts.recurring.store', $account), [])
                ->assertForbidden();
        });
    });

    describe('update', function () {
        it('updates a recurring transaction', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $recurring = RecurringTransaction::factory()->create(['account_id' => $account->id, 'amount' => 5]);

            $this->actingAs($user)
                ->patch(route('accounts.recurring.update', [$account, $recurring]), [
                    'type' => 'credit',
                    'amount' => '10.00',
                    'frequency' => 'monthly',
                    'next_run_at' => now()->addMonth()->toDateTimeString(),
                ])
                ->assertRedirect(route('accounts.recurring.index', $account));

            expect((float) $recurring->fresh()->amount)->toBe(10.0);
        });
    });

    describe('destroy', function () {
        it('deletes a recurring transaction', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $recurring = RecurringTransaction::factory()->create(['account_id' => $account->id]);

            $this->actingAs($user)
                ->delete(route('accounts.recurring.destroy', [$account, $recurring]))
                ->assertRedirect(route('accounts.recurring.index', $account));

            expect(RecurringTransaction::find($recurring->id))->toBeNull();
        });
    });

    describe('index', function () {
        it('renders the recurring transactions index page', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            RecurringTransaction::factory()->create(['account_id' => $account->id]);

            $this->actingAs($user)
                ->get(route('accounts.recurring.index', $account))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Recurring/Index')
                    ->has('account')
                    ->has('recurrings', 1)
                );
        });
    });

    describe('create', function () {
        it('renders the create form', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->get(route('accounts.recurring.create', $account))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Recurring/Create')
                    ->has('account')
                );
        });
    });

    describe('edit', function () {
        it('renders the edit form', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $recurring = RecurringTransaction::factory()->create(['account_id' => $account->id]);

            $this->actingAs($user)
                ->get(route('accounts.recurring.edit', [$account, $recurring]))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Recurring/Edit')
                    ->has('account')
                    ->has('recurring')
                );
        });
    });
});
