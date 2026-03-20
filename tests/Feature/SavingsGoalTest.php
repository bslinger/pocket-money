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
