<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\PocketMoneySchedule;
use App\Models\Transaction;
use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;
use Illuminate\Support\Facades\Artisan;

describe('pocket money schedule controller', function () {

    describe('store', function () {
        it('creates a weekly schedule for a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'       => '10.00',
                    'frequency'    => 'weekly',
                    'day_of_week'  => 0, // Monday
                    'day_of_month' => null,
                ])
                ->assertRedirect();

            $schedule = PocketMoneySchedule::where('spender_id', $spender->id)->first();
            expect($schedule)->not->toBeNull();
            expect($schedule->amount)->toBe('10.00');
            expect($schedule->frequency)->toBe('weekly');
            expect($schedule->day_of_week)->toBe(0);
            expect($schedule->is_active)->toBeTrue();
            expect($schedule->next_run_at)->not->toBeNull();
        });

        it('creates a monthly schedule', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'       => '50.00',
                    'frequency'    => 'monthly',
                    'day_of_week'  => null,
                    'day_of_month' => 15,
                ])
                ->assertRedirect();

            $schedule = PocketMoneySchedule::where('spender_id', $spender->id)->first();
            expect($schedule->frequency)->toBe('monthly');
            expect($schedule->day_of_month)->toBe(15);
        });

        it('deactivates existing schedule when creating a new one', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $old = PocketMoneySchedule::factory()->weekly()->create([
                'spender_id' => $spender->id,
                'created_by' => $user->id,
            ]);

            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'       => '15.00',
                    'frequency'    => 'weekly',
                    'day_of_week'  => 2,
                    'day_of_month' => null,
                ])
                ->assertRedirect();

            expect($old->fresh()->is_active)->toBeFalse();
            expect(PocketMoneySchedule::where('spender_id', $spender->id)->where('is_active', true)->count())->toBe(1);
        });

        it('requires parent role', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = childLinkedTo($spender);

            $this->actingAs($child)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount' => '5.00', 'frequency' => 'weekly', 'day_of_week' => 0,
                ])
                ->assertForbidden();
        });
    });

    describe('destroy', function () {
        it('deactivates the schedule', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $schedule = PocketMoneySchedule::factory()->weekly()->create([
                'spender_id' => $spender->id,
                'created_by' => $user->id,
            ]);

            $this->actingAs($user)
                ->delete(route('pocket-money-schedule.destroy', $schedule->id))
                ->assertRedirect();

            expect($schedule->fresh()->is_active)->toBeFalse();
        });
    });
});

describe('pocket-money:run command', function () {

    it('pays a due schedule with no responsibilities', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        PocketMoneySchedule::factory()->due()->create([
            'spender_id' => $spender->id,
            'amount'     => '5.00',
            'created_by' => $user->id,
        ]);

        Artisan::call('pocket-money:run');

        expect((float) $account->fresh()->balance)->toBe(5.0);
        expect(Transaction::where('account_id', $account->id)->count())->toBe(1);
    });

    it('pays when all responsibility chores are met', function () {
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $chore = Chore::factory()->responsibility()->create(['family_id' => $family->id]);
        $spender->chores()->attach($chore->id);

        ChoreCompletion::factory()->create([
            'chore_id'     => $chore->id,
            'spender_id'   => $spender->id,
            'status'       => CompletionStatus::Approved,
            'completed_at' => now(),
        ]);

        PocketMoneySchedule::factory()->due()->create([
            'spender_id' => $spender->id,
            'amount'     => '10.00',
            'created_by' => $user->id,
        ]);

        Artisan::call('pocket-money:run');

        expect((float) $account->fresh()->balance)->toBe(10.0);
    });

    it('skips when a responsibility chore is not met', function () {
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $chore = Chore::factory()->responsibility()->create(['family_id' => $family->id]);
        $spender->chores()->attach($chore->id);
        // No completion this week

        PocketMoneySchedule::factory()->due()->create([
            'spender_id' => $spender->id,
            'amount'     => '10.00',
            'created_by' => $user->id,
        ]);

        Artisan::call('pocket-money:run');

        expect((float) $account->fresh()->balance)->toBe(0.0);
        expect(Transaction::where('account_id', $account->id)->count())->toBe(0);
    });

    it('advances next_run_at even when skipped', function () {
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $chore = Chore::factory()->responsibility()->create(['family_id' => $family->id]);
        $spender->chores()->attach($chore->id);

        $originalNextRun = now()->subHour();
        $schedule = PocketMoneySchedule::factory()->due()->create([
            'spender_id'  => $spender->id,
            'amount'      => '5.00',
            'frequency'   => 'weekly',
            'created_by'  => $user->id,
            'next_run_at' => $originalNextRun,
        ]);

        Artisan::call('pocket-money:run');

        expect($schedule->fresh()->next_run_at->gt($originalNextRun))->toBeTrue();
    });

    it('does not process inactive schedules', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        PocketMoneySchedule::factory()->due()->inactive()->create([
            'spender_id' => $spender->id,
            'amount'     => '5.00',
            'created_by' => $user->id,
        ]);

        Artisan::call('pocket-money:run');

        expect((float) $account->fresh()->balance)->toBe(0.0);
    });
});
