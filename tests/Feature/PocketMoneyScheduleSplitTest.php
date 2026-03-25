<?php

use App\Models\Account;
use App\Models\PocketMoneySchedule;
use App\Models\PocketMoneyScheduleSplit;
use App\Models\Transaction;
use Illuminate\Support\Facades\Artisan;

describe('pocket money schedule splits', function () {

    describe('store with splits', function () {
        it('creates splits when distributing between accounts', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account1 = Account::factory()->create(['spender_id' => $spender->id]);
            $account2 = Account::factory()->create(['spender_id' => $spender->id]);

            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'      => '20.00',
                    'frequency'   => 'weekly',
                    'day_of_week' => 0,
                    'splits'      => [
                        ['account_id' => $account1->id, 'percentage' => '75'],
                        ['account_id' => $account2->id, 'percentage' => '25'],
                    ],
                ])
                ->assertRedirect();

            $schedule = PocketMoneySchedule::where('spender_id', $spender->id)->first();
            expect($schedule)->not->toBeNull();
            expect($schedule->account_id)->toBeNull();
            expect($schedule->splits)->toHaveCount(2);

            $split1 = $schedule->splits->firstWhere('account_id', $account1->id);
            $split2 = $schedule->splits->firstWhere('account_id', $account2->id);
            expect((float) $split1->percentage)->toBe(75.0);
            expect((float) $split2->percentage)->toBe(25.0);
        });

        it('clears splits and sets account_id when not distributing', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id]);

            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'      => '10.00',
                    'frequency'   => 'weekly',
                    'day_of_week' => 0,
                    'account_id'  => $account->id,
                    'splits'      => [],
                ])
                ->assertRedirect();

            $schedule = PocketMoneySchedule::where('spender_id', $spender->id)->first();
            expect($schedule->account_id)->toBe($account->id);
            expect($schedule->splits)->toHaveCount(0);
        });

        it('rejects splits that do not total 100%', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account1 = Account::factory()->create(['spender_id' => $spender->id]);
            $account2 = Account::factory()->create(['spender_id' => $spender->id]);

            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'      => '20.00',
                    'frequency'   => 'weekly',
                    'day_of_week' => 0,
                    'splits'      => [
                        ['account_id' => $account1->id, 'percentage' => '60'],
                        ['account_id' => $account2->id, 'percentage' => '20'],
                    ],
                ])
                ->assertSessionHasErrors('splits');
        });

        it('replaces the previous active schedule when updating', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account1 = Account::factory()->create(['spender_id' => $spender->id]);
            $account2 = Account::factory()->create(['spender_id' => $spender->id]);

            // Create initial 50/50 split
            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'      => '20.00',
                    'frequency'   => 'weekly',
                    'day_of_week' => 0,
                    'splits'      => [
                        ['account_id' => $account1->id, 'percentage' => '50'],
                        ['account_id' => $account2->id, 'percentage' => '50'],
                    ],
                ]);

            // Update to 80/20
            $this->actingAs($user)
                ->post(route('pocket-money-schedule.store', $spender->id), [
                    'amount'      => '20.00',
                    'frequency'   => 'weekly',
                    'day_of_week' => 0,
                    'splits'      => [
                        ['account_id' => $account1->id, 'percentage' => '80'],
                        ['account_id' => $account2->id, 'percentage' => '20'],
                    ],
                ]);

            expect(PocketMoneySchedule::where('spender_id', $spender->id)->where('is_active', true)->count())->toBe(1);

            $schedule = PocketMoneySchedule::where('spender_id', $spender->id)
                ->where('is_active', true)
                ->with('splits')
                ->first();
            expect($schedule->splits)->toHaveCount(2);
            expect((float) $schedule->splits->firstWhere('account_id', $account1->id)->percentage)->toBe(80.0);
        });
    });

    describe('pocket-money:run with splits', function () {
        it('creates multiple transactions according to splits', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account1 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);
            $account2 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $schedule = PocketMoneySchedule::create([
                'spender_id'  => $spender->id,
                'account_id'  => null,
                'amount'      => '20.00',
                'frequency'   => 'weekly',
                'day_of_week' => 0,
                'is_active'   => true,
                'next_run_at' => now()->subMinute(),
                'created_by'  => $user->id,
            ]);

            PocketMoneyScheduleSplit::create([
                'pocket_money_schedule_id' => $schedule->id,
                'account_id'               => $account1->id,
                'percentage'               => '75.0000',
                'sort_order'               => 0,
            ]);
            PocketMoneyScheduleSplit::create([
                'pocket_money_schedule_id' => $schedule->id,
                'account_id'               => $account2->id,
                'percentage'               => '25.0000',
                'sort_order'               => 1,
            ]);

            Artisan::call('pocket-money:run');

            expect(Transaction::where('account_id', $account1->id)->count())->toBe(1);
            expect(Transaction::where('account_id', $account2->id)->count())->toBe(1);
            expect((float) Transaction::where('account_id', $account1->id)->value('amount'))->toBe(15.0);
            expect((float) Transaction::where('account_id', $account2->id)->value('amount'))->toBe(5.0);

            expect((float) $account1->fresh()->balance)->toBe(15.0);
            expect((float) $account2->fresh()->balance)->toBe(5.0);
        });

        it('distributes remainder to last split to handle rounding', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account1 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);
            $account2 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);
            $account3 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            $schedule = PocketMoneySchedule::create([
                'spender_id'  => $spender->id,
                'account_id'  => null,
                'amount'      => '10.00',
                'frequency'   => 'weekly',
                'day_of_week' => 0,
                'is_active'   => true,
                'next_run_at' => now()->subMinute(),
                'created_by'  => $user->id,
            ]);

            foreach ([
                [$account1->id, '33.3333', 0],
                [$account2->id, '33.3333', 1],
                [$account3->id, '33.3334', 2],
            ] as [$accountId, $pct, $order]) {
                PocketMoneyScheduleSplit::create([
                    'pocket_money_schedule_id' => $schedule->id,
                    'account_id'               => $accountId,
                    'percentage'               => $pct,
                    'sort_order'               => $order,
                ]);
            }

            Artisan::call('pocket-money:run');

            $total = Transaction::whereIn('account_id', [$account1->id, $account2->id, $account3->id])
                ->sum('amount');

            expect((float) $total)->toBe(10.0);
        });

        it('falls back to single account when no splits defined', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

            PocketMoneySchedule::create([
                'spender_id'  => $spender->id,
                'account_id'  => $account->id,
                'amount'      => '10.00',
                'frequency'   => 'weekly',
                'day_of_week' => 0,
                'is_active'   => true,
                'next_run_at' => now()->subMinute(),
                'created_by'  => $user->id,
            ]);

            Artisan::call('pocket-money:run');

            expect(Transaction::where('account_id', $account->id)->count())->toBe(1);
            expect((float) $account->fresh()->balance)->toBe(10.0);
        });
    });
});
