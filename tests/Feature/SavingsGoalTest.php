<?php

use App\Models\Account;
use App\Models\SavingsGoal;

describe('savings goals', function () {

    describe('store', function () {
        it('creates a savings goal for a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('goals.store'), [
                    'spender_id'    => $spenders->first()->id,
                    'name'          => 'New Bike',
                    'target_amount' => '150.00',
                ])
                ->assertRedirect(route('goals.index'));

            expect(SavingsGoal::where('name', 'New Bike')->exists())->toBeTrue();
        });

        it('can be created with a target date', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('goals.store'), [
                    'spender_id'    => $spenders->first()->id,
                    'name'          => 'Summer Trip',
                    'target_amount' => '200.00',
                    'target_date'   => '2026-12-25',
                ])
                ->assertRedirect(route('goals.index'));

            $goal = SavingsGoal::where('name', 'Summer Trip')->first();
            expect($goal)->not->toBeNull();
            expect($goal->target_date->format('Y-m-d'))->toBe('2026-12-25');
        });

        it('validates name and target_amount are required', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('goals.store'), ['spender_id' => $spenders->first()->id])
                ->assertSessionHasErrors(['name', 'target_amount']);
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->post(route('goals.store'), [])
                ->assertForbidden();
        });
    });

    describe('update', function () {
        it('updates a savings goal', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->patch(route('goals.update', $goal), [
                    'name'          => 'Updated Goal',
                    'target_amount' => '200.00',
                ])
                ->assertRedirect(route('goals.show', $goal));

            expect($goal->fresh()->name)->toBe('Updated Goal');
            expect((float) $goal->fresh()->target_amount)->toBe(200.0);
        });
    });

    describe('sync from account', function () {
        it('sets current_amount to the linked account balance', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '75.00']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'     => $spenders->first()->id,
                'account_id'     => $account->id,
                'target_amount'  => '100.00',
                'current_amount' => '0.00',
            ]);

            $this->actingAs($user)
                ->post(route('goals.sync', $goal))
                ->assertRedirect();

            expect((float) $goal->fresh()->current_amount)->toBe(75.0);
        });

        it('marks complete when account balance meets target', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '100.00']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'     => $spenders->first()->id,
                'account_id'     => $account->id,
                'target_amount'  => '100.00',
                'current_amount' => '0.00',
                'is_completed'   => false,
            ]);

            $this->actingAs($user)->post(route('goals.sync', $goal));

            expect($goal->fresh()->is_completed)->toBeTrue();
        });
    });

    describe('contribute', function () {
        it('adds to the current amount', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'     => $spenders->first()->id,
                'target_amount'  => '100.00',
                'current_amount' => '20.00',
            ]);

            $this->actingAs($user)
                ->post(route('goals.contribute', $goal), ['amount' => '30.00'])
                ->assertRedirect();

            expect((float) $goal->fresh()->current_amount)->toBe(50.0);
            expect($goal->fresh()->is_completed)->toBeFalse();
        });

        it('marks the goal complete when current_amount reaches target', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'     => $spenders->first()->id,
                'target_amount'  => '100.00',
                'current_amount' => '80.00',
                'is_completed'   => false,
            ]);

            $this->actingAs($user)
                ->post(route('goals.contribute', $goal), ['amount' => '20.00'])
                ->assertRedirect();

            expect($goal->fresh()->is_completed)->toBeTrue();
        });

        it('applies parent match percentage to contribution', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'      => $spenders->first()->id,
                'target_amount'   => '200.00',
                'current_amount'  => '0.00',
                'match_percentage' => 50,
            ]);

            $this->actingAs($user)
                ->post(route('goals.contribute', $goal), ['amount' => '20.00'])
                ->assertRedirect();

            // 20 contributed + 10 matched (50%) = 30 total
            expect((float) $goal->fresh()->current_amount)->toBe(30.0);
        });

        it('validates amount is required and positive', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('goals.contribute', $goal), ['amount' => '0'])
                ->assertSessionHasErrors('amount');
        });

        it('rejects contributions to goals linked to an account', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '50.00']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '100.00',
            ]);

            $this->actingAs($user)
                ->post(route('goals.contribute', $goal), ['amount' => '10.00'])
                ->assertStatus(422);
        });
    });

    describe('destroy', function () {
        it('deletes a savings goal', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->delete(route('goals.destroy', $goal))
                ->assertRedirect(route('goals.index'));

            expect(SavingsGoal::find($goal->id))->toBeNull();
        });
    });
});
