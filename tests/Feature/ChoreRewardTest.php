<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\ChoreReward;
use App\Models\Transaction;
use App\Enums\CompletionStatus;
use Illuminate\Support\Facades\Artisan;

describe('chore rewards', function () {

    describe('store', function () {
        it('creates a chore reward with required chores', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $chore = Chore::factory()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);

            $this->actingAs($user)
                ->post(route('chore-rewards.store', $spender->id), [
                    'amount'      => '10.00',
                    'description' => 'Weekend bonus',
                    'payout_date' => null,
                    'chore_ids'   => [$chore->id],
                ])
                ->assertRedirect();

            $reward = ChoreReward::where('spender_id', $spender->id)->first();
            expect($reward)->not->toBeNull();
            expect($reward->amount)->toBe('10.00');
            expect($reward->chores()->count())->toBe(1);
        });

        it('requires at least one chore', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->post(route('chore-rewards.store', $spenders->first()->id), [
                    'amount'    => '5.00',
                    'chore_ids' => [],
                ])
                ->assertSessionHasErrors('chore_ids');
        });

        it('requires parent role', function () {
            [$_parent, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $chore = Chore::factory()->create(['family_id' => $family->id]);
            $child = childLinkedTo($spender);

            $this->actingAs($child)
                ->post(route('chore-rewards.store', $spender->id), [
                    'amount'    => '5.00',
                    'chore_ids' => [$chore->id],
                ])
                ->assertForbidden();
        });

        it('auto-pays immediately when all chores are already approved and no payout date', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $chore = Chore::factory()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);

            // Pre-approve the chore
            ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Approved,
            ]);

            $this->actingAs($user)
                ->post(route('chore-rewards.store', $spender->id), [
                    'amount'    => '15.00',
                    'chore_ids' => [$chore->id],
                ])
                ->assertRedirect();

            expect((float) $account->fresh()->balance)->toBe(15.0);
            $reward = ChoreReward::where('spender_id', $spender->id)->first();
            expect($reward->is_paid)->toBeTrue();
        });
    });

    describe('destroy', function () {
        it('deletes an unpaid reward', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $reward = ChoreReward::factory()->create([
                'spender_id' => $spender->id,
                'created_by' => $user->id,
            ]);

            $this->actingAs($user)
                ->delete(route('chore-rewards.destroy', $reward->id))
                ->assertRedirect();

            expect(ChoreReward::find($reward->id))->toBeNull();
        });
    });

    describe('auto-pay on chore approval', function () {
        it('pays a chore reward when the last required chore is approved', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $chore = Chore::factory()->earns()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);

            $completion = ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Pending,
            ]);

            $reward = ChoreReward::factory()->create([
                'spender_id'  => $spender->id,
                'amount'      => '20.00',
                'payout_date' => null,
                'is_paid'     => false,
                'created_by'  => $user->id,
            ]);
            $reward->chores()->attach($chore->id);

            $this->actingAs($user)
                ->patch(route('chore-completions.approve', $completion->id))
                ->assertRedirect();

            expect($reward->fresh()->is_paid)->toBeTrue();
            // earns chore reward (1.00) + chore reward (20.00) = 21.00
            expect((float) $account->fresh()->balance)->toBe(21.0);
        });

        it('does not pay a reward with a future payout date on approval', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $chore = Chore::factory()->noReward()->noApproval()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);

            $completion = ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Pending,
            ]);

            $reward = ChoreReward::factory()->create([
                'spender_id'  => $spender->id,
                'amount'      => '20.00',
                'payout_date' => now()->addDays(7)->toDateString(),
                'is_paid'     => false,
                'created_by'  => $user->id,
            ]);
            $reward->chores()->attach($chore->id);

            $this->actingAs($user)
                ->patch(route('chore-completions.approve', $completion->id))
                ->assertRedirect();

            expect($reward->fresh()->is_paid)->toBeFalse();
            expect((float) $account->fresh()->balance)->toBe(0.0);
        });
    });

    describe('chore-rewards:run command', function () {
        it('pays rewards whose payout date has arrived and chores are complete', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $chore = Chore::factory()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);

            ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Approved,
            ]);

            $reward = ChoreReward::factory()->create([
                'spender_id'  => $spender->id,
                'amount'      => '25.00',
                'payout_date' => now()->toDateString(),
                'is_paid'     => false,
                'created_by'  => $user->id,
            ]);
            $reward->chores()->attach($chore->id);

            Artisan::call('chore-rewards:run');

            expect($reward->fresh()->is_paid)->toBeTrue();
            expect((float) $account->fresh()->balance)->toBe(25.0);
        });

        it('skips rewards when chores are not complete', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $chore = Chore::factory()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);

            $reward = ChoreReward::factory()->create([
                'spender_id'  => $spender->id,
                'amount'      => '25.00',
                'payout_date' => now()->toDateString(),
                'is_paid'     => false,
                'created_by'  => $user->id,
            ]);
            $reward->chores()->attach($chore->id);

            Artisan::call('chore-rewards:run');

            expect($reward->fresh()->is_paid)->toBeFalse();
            expect((float) $account->fresh()->balance)->toBe(0.0);
        });

        it('does not process future payout dates', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $chore = Chore::factory()->create(['family_id' => $family->id]);
            $spender->chores()->attach($chore->id);
            ChoreCompletion::factory()->create([
                'chore_id'   => $chore->id,
                'spender_id' => $spender->id,
                'status'     => CompletionStatus::Approved,
            ]);

            $reward = ChoreReward::factory()->create([
                'spender_id'  => $spender->id,
                'amount'      => '25.00',
                'payout_date' => now()->addDays(1)->toDateString(),
                'is_paid'     => false,
                'created_by'  => $user->id,
            ]);
            $reward->chores()->attach($chore->id);

            Artisan::call('chore-rewards:run');

            expect($reward->fresh()->is_paid)->toBeFalse();
        });
    });
});
