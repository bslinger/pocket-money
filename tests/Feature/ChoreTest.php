<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\Transaction;
use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;

describe('chores', function () {

    describe('create / store', function () {
        it('creates an earns chore and syncs spenders', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);

            $this->actingAs($user)
                ->post(route('chores.store'), [
                    'family_id'        => $family->id,
                    'name'             => 'Wash dishes',
                    'reward_type'      => 'earns',
                    'amount'           => '1.50',
                    'frequency'        => 'weekly',
                    'days_of_week'     => [0],
                    'requires_approval' => true,
                    'up_for_grabs'     => false,
                    'is_active'        => true,
                    'spender_ids'      => [$spenders->first()->id],
                ])
                ->assertRedirect(route('chores.index'));

            $chore = Chore::where('name', 'Wash dishes')->first();
            expect($chore)->not->toBeNull();
            expect($chore->spenders()->count())->toBe(1);
        });

        it('creates a responsibility chore', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('chores.store'), [
                    'family_id'        => $family->id,
                    'name'             => 'Make bed',
                    'reward_type'      => 'responsibility',
                    'frequency'        => 'daily',
                    'days_of_week'     => [],
                    'requires_approval' => false,
                    'up_for_grabs'     => false,
                    'is_active'        => true,
                    'spender_ids'      => [$spenders->first()->id],
                ])
                ->assertRedirect(route('chores.index'));

            expect(Chore::where('name', 'Make bed')->value('reward_type'))->toBe(ChoreRewardType::Responsibility);
        });

        it('validates name is required', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->post(route('chores.store'), ['family_id' => $family->id, 'spender_ids' => []])
                ->assertSessionHasErrors('name');
        });

        it('requires parent role', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->post(route('chores.store'), [])
                ->assertForbidden();
        });
    });

    describe('update', function () {
        it('updates a chore and re-syncs spenders', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);
            $chore = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $user->id]);
            $chore->spenders()->sync([$spenders->first()->id]);

            $this->actingAs($user)
                ->put(route('chores.update', $chore), [
                    'family_id'        => $family->id,
                    'name'             => 'Updated Chore',
                    'reward_type'      => 'earns',
                    'amount'           => '2.00',
                    'frequency'        => 'weekly',
                    'days_of_week'     => [1],
                    'requires_approval' => true,
                    'up_for_grabs'     => false,
                    'is_active'        => true,
                    'spender_ids'      => [$spenders->last()->id],
                ])
                ->assertRedirect(route('chores.index'));

            expect($chore->fresh()->name)->toBe('Updated Chore');
            expect($chore->spenders()->pluck('spenders.id')->toArray())->toBe([$spenders->last()->id]);
        });
    });

    describe('destroy', function () {
        it('deletes a chore', function () {
            [$user, $family] = parentWithFamily();
            $chore = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $user->id]);

            $this->actingAs($user)
                ->delete(route('chores.destroy', $chore))
                ->assertRedirect(route('chores.index'));

            expect(Chore::find($chore->id))->toBeNull();
        });
    });
});

describe('chore completions', function () {

    describe('store (child marks done)', function () {
        it('creates a pending completion when a linked child marks a chore done', function () {
            [$_user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child   = childLinkedTo($spender);
            $chore   = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $child->id]);
            $chore->spenders()->sync([$spender->id]);

            $this->actingAs($child)
                ->post(route('chores.complete', $chore), ['spender_id' => $spender->id])
                ->assertRedirect();

            expect(ChoreCompletion::where('chore_id', $chore->id)
                ->where('spender_id', $spender->id)
                ->where('status', CompletionStatus::Pending)
                ->exists()
            )->toBeTrue();
        });

        it('prevents duplicate pending completions', function () {
            [$_user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child   = childLinkedTo($spender);
            $chore   = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $child->id]);
            $chore->spenders()->sync([$spender->id]);

            ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Pending,
            ]);

            $this->actingAs($child)
                ->post(route('chores.complete', $chore), ['spender_id' => $spender->id]);

            expect(ChoreCompletion::where('chore_id', $chore->id)->count())->toBe(1);
        });

        it('forbids an unlinked user from completing a chore', function () {
            [$_user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender   = $spenders->first();
            $otherUser = \App\Models\User::factory()->create();
            $chore     = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $otherUser->id]);
            $chore->spenders()->sync([$spender->id]);

            $this->actingAs($otherUser)
                ->post(route('chores.complete', $chore), ['spender_id' => $spender->id])
                ->assertForbidden();
        });
    });

    describe('approve', function () {
        it('approves a completion and credits the account for an earns chore', function () {
            [$parent, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0, 'is_savings_pot' => false]);
            $chore   = Chore::factory()->earns(2.50)->create(['family_id' => $family->id, 'created_by' => $parent->id]);
            $completion = ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Pending,
            ]);

            $this->actingAs($parent)
                ->patch(route('chore-completions.approve', $completion))
                ->assertRedirect();

            expect($completion->fresh()->status)->toBe(CompletionStatus::Approved);
            expect((float) $account->fresh()->balance)->toBe(2.5);
            expect(Transaction::where('account_id', $account->id)->exists())->toBeTrue();
        });

        it('approves a responsibility chore without creating a transaction', function () {
            [$parent, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);
            $chore = Chore::factory()->responsibility()->create(['family_id' => $family->id, 'created_by' => $parent->id]);
            $completion = ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Pending,
            ]);

            $this->actingAs($parent)
                ->patch(route('chore-completions.approve', $completion));

            expect($completion->fresh()->status)->toBe(CompletionStatus::Approved);
            expect(Transaction::count())->toBe(0);
        });
    });

    describe('decline', function () {
        it('declines a completion with an optional note', function () {
            [$parent, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $chore = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $parent->id]);
            $completion = ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Pending,
            ]);

            $this->actingAs($parent)
                ->patch(route('chore-completions.decline', $completion), ['note' => 'Not done properly'])
                ->assertRedirect();

            $fresh = $completion->fresh();
            expect($fresh->status)->toBe(CompletionStatus::Declined);
            expect($fresh->note)->toBe('Not done properly');
        });
    });
});
