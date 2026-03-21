<?php

use App\Models\Account;
use App\Models\SavingsGoal;

describe('savings goals', function () {

    describe('allocations', function () {
        it('allocates account balance to goals in priority order', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '15.00']);

            $goal1 = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '10.00',
                'sort_order'    => 0,
            ]);
            $goal2 = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '20.00',
                'sort_order'    => 1,
            ]);

            $goals = SavingsGoal::where('account_id', $account->id)->orderBy('sort_order')->get();
            $goals->load('account');
            SavingsGoal::applyAccountAllocations($goals);

            $fresh1 = $goals->firstWhere('id', $goal1->id);
            $fresh2 = $goals->firstWhere('id', $goal2->id);

            expect((float) $fresh1->allocated_amount)->toBe(10.0);
            expect((float) $fresh2->allocated_amount)->toBe(5.0);
        });

        it('fills first goal fully before spilling to next', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '8.00']);

            $goal1 = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '10.00',
                'sort_order'    => 0,
            ]);
            $goal2 = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '20.00',
                'sort_order'    => 1,
            ]);

            $goals = SavingsGoal::where('account_id', $account->id)->orderBy('sort_order')->get();
            $goals->load('account');
            SavingsGoal::applyAccountAllocations($goals);

            $fresh1 = $goals->firstWhere('id', $goal1->id);
            $fresh2 = $goals->firstWhere('id', $goal2->id);

            expect((float) $fresh1->allocated_amount)->toBe(8.0);
            expect((float) $fresh2->allocated_amount)->toBe(0.0);
        });
    });

    describe('reorder', function () {
        it('reorders goals within an account', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $goal1 = SavingsGoal::factory()->create([
                'spender_id' => $spenders->first()->id,
                'account_id' => $account->id,
                'sort_order' => 0,
            ]);
            $goal2 = SavingsGoal::factory()->create([
                'spender_id' => $spenders->first()->id,
                'account_id' => $account->id,
                'sort_order' => 1,
            ]);

            $this->actingAs($user)
                ->post(route('goals.reorder'), ['goal_ids' => [$goal2->id, $goal1->id]])
                ->assertRedirect();

            expect($goal1->fresh()->sort_order)->toBe(1);
            expect($goal2->fresh()->sort_order)->toBe(0);
        });

        it('requires parent role to reorder', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $goal = SavingsGoal::factory()->create(['spender_id' => $spenders->first()->id, 'account_id' => $account->id]);

            $this->actingAs($child)
                ->post(route('goals.reorder'), ['goal_ids' => [$goal->id]])
                ->assertForbidden();
        });
    });


    describe('store', function () {
        it('creates a savings goal for a spender linked to an account', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('goals.store'), [
                    'spender_id'    => $spenders->first()->id,
                    'account_id'    => $account->id,
                    'name'          => 'New Bike',
                    'target_amount' => '150.00',
                ])
                ->assertRedirect(route('goals.index'));

            expect(SavingsGoal::where('name', 'New Bike')->exists())->toBeTrue();
        });

        it('can be created with a target date', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->post(route('goals.store'), [
                    'spender_id'    => $spenders->first()->id,
                    'account_id'    => $account->id,
                    'name'          => 'Summer Trip',
                    'target_amount' => '200.00',
                    'target_date'   => '2026-12-25',
                ])
                ->assertRedirect(route('goals.index'));

            $goal = SavingsGoal::where('name', 'Summer Trip')->first();
            expect($goal)->not->toBeNull();
            expect($goal->target_date->format('Y-m-d'))->toBe('2026-12-25');
        });

        it('validates name, target_amount, and account_id are required', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('goals.store'), ['spender_id' => $spenders->first()->id])
                ->assertSessionHasErrors(['name', 'target_amount', 'account_id']);
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
                    'account_id'    => $goal->account_id,
                ])
                ->assertRedirect(route('goals.show', $goal));

            expect($goal->fresh()->name)->toBe('Updated Goal');
            expect((float) $goal->fresh()->target_amount)->toBe(200.0);
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
