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

    describe('abandon', function () {
        it('hard-deletes a goal created less than 24 hours ago', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create([
                'spender_id' => $spenders->first()->id,
                'created_at' => now()->subHours(2),
            ]);

            $this->actingAs($user)
                ->patch(route('goals.abandon', $goal))
                ->assertRedirect(route('goals.index'));

            expect(SavingsGoal::find($goal->id))->toBeNull();
        });

        it('marks a goal as abandoned when older than 24 hours', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create([
                'spender_id' => $spenders->first()->id,
                'created_at' => now()->subDays(2),
            ]);

            $this->actingAs($user)
                ->patch(route('goals.abandon', $goal))
                ->assertRedirect(route('goals.index'));

            $fresh = SavingsGoal::find($goal->id);
            expect($fresh)->not->toBeNull();
            expect($fresh->abandoned_at)->not->toBeNull();
        });

        it('stores allocated amount at time of abandonment', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create([
                'spender_id' => $spenders->first()->id,
                'balance'    => '50.00',
            ]);
            $goal = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '100.00',
                'sort_order'    => 0,
                'created_at'    => now()->subDays(2),
            ]);

            $this->actingAs($user)->patch(route('goals.abandon', $goal));

            $fresh = SavingsGoal::find($goal->id);
            expect((float) $fresh->abandoned_allocated_amount)->toBe(50.0);
        });
    });

    describe('index', function () {
        it('renders the goals index page', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '20.00']);
            SavingsGoal::factory()->create(['spender_id' => $spenders->first()->id, 'account_id' => $account->id]);

            $this->actingAs($user)
                ->get(route('goals.index'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Goals/Index'));
        });
    });

    describe('abandoned', function () {
        it('renders the abandoned goals page', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            SavingsGoal::factory()->create([
                'spender_id'  => $spenders->first()->id,
                'abandoned_at' => now()->subDay(),
            ]);

            $this->actingAs($user)
                ->get(route('goals.abandoned'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Goals/Abandoned'));
        });

        it('redirects to goals index when there are no abandoned goals', function () {
            [$user] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->get(route('goals.abandoned'))
                ->assertRedirect(route('goals.index'));
        });
    });

    describe('create', function () {
        it('renders the create goal page', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            Account::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->get(route('goals.create'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Goals/Create'));
        });
    });

    describe('show', function () {
        it('renders a single goal with computed allocation', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '30.00']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'    => $spenders->first()->id,
                'account_id'    => $account->id,
                'target_amount' => '50.00',
                'sort_order'    => 0,
            ]);

            $this->actingAs($user)
                ->get(route('goals.show', $goal))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Goals/Show'));
        });
    });

    describe('edit', function () {
        it('renders the edit goal page', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
            $goal = SavingsGoal::factory()->create([
                'spender_id' => $spenders->first()->id,
                'account_id' => $account->id,
            ]);

            $this->actingAs($user)
                ->get(route('goals.edit', $goal))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Goals/Edit'));
        });
    });

    describe('destroy-abandoned', function () {
        it('permanently deletes an abandoned goal', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create([
                'spender_id'  => $spenders->first()->id,
                'abandoned_at' => now()->subDay(),
            ]);

            $this->actingAs($user)
                ->delete(route('goals.destroy-abandoned', $goal))
                ->assertRedirect(route('goals.abandoned'));

            expect(SavingsGoal::find($goal->id))->toBeNull();
        });

        it('forbids destroying a non-abandoned goal via destroy-abandoned', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $goal = SavingsGoal::factory()->create(['spender_id' => $spenders->first()->id]);

            $this->actingAs($user)
                ->delete(route('goals.destroy-abandoned', $goal))
                ->assertForbidden();
        });
    });
});
