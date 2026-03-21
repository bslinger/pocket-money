<?php

use App\Enums\Frequency;
use App\Enums\TxType;
use App\Models\Account;
use App\Models\RecurringTransaction;
use App\Models\RecurringTransactionSkip;
use App\Models\Transaction;

describe('recurring:run command', function () {

    it('creates a credit transaction and increments balance', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '10.00']);

        RecurringTransaction::factory()->create([
            'account_id'  => $account->id,
            'type'        => TxType::Credit,
            'amount'      => '5.00',
            'frequency'   => Frequency::Weekly,
            'next_run_at' => now()->subMinute(),
            'is_active'   => true,
            'created_by'  => $user->id,
        ]);

        $this->artisan('recurring:run')->assertSuccessful();

        expect((float) $account->fresh()->balance)->toBe(15.0);
        expect(Transaction::where('account_id', $account->id)->where('type', TxType::Credit)->exists())->toBeTrue();
    });

    it('creates a debit transaction and decrements balance', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '20.00']);

        RecurringTransaction::factory()->create([
            'account_id'  => $account->id,
            'type'        => TxType::Debit,
            'amount'      => '8.00',
            'frequency'   => Frequency::Weekly,
            'next_run_at' => now()->subMinute(),
            'is_active'   => true,
            'created_by'  => $user->id,
        ]);

        $this->artisan('recurring:run')->assertSuccessful();

        expect((float) $account->fresh()->balance)->toBe(12.0);
    });

    it('skips a transaction that has a skip record for today', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '10.00']);
        $dueAt = now()->subMinute();

        $recurring = RecurringTransaction::factory()->create([
            'account_id'  => $account->id,
            'type'        => TxType::Credit,
            'amount'      => '5.00',
            'frequency'   => Frequency::Weekly,
            'next_run_at' => $dueAt,
            'is_active'   => true,
            'created_by'  => $user->id,
        ]);

        RecurringTransactionSkip::create([
            'recurring_transaction_id' => $recurring->id,
            'skipped_date'             => $dueAt->toDateString(),
        ]);

        $this->artisan('recurring:run')->assertSuccessful();

        // Balance unchanged, no transaction created
        expect((float) $account->fresh()->balance)->toBe(10.0);
        expect(Transaction::where('account_id', $account->id)->exists())->toBeFalse();
    });

    it('does not process inactive recurring transactions', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '10.00']);

        RecurringTransaction::factory()->inactive()->create([
            'account_id'  => $account->id,
            'next_run_at' => now()->subMinute(),
            'created_by'  => $user->id,
        ]);

        $this->artisan('recurring:run')->assertSuccessful();

        expect((float) $account->fresh()->balance)->toBe(10.0);
    });

    it('does not process transactions not yet due', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $account = Account::factory()->create(['spender_id' => $spenders->first()->id, 'balance' => '10.00']);

        RecurringTransaction::factory()->create([
            'account_id'  => $account->id,
            'next_run_at' => now()->addHour(),
            'is_active'   => true,
            'created_by'  => $user->id,
        ]);

        $this->artisan('recurring:run')->assertSuccessful();

        expect((float) $account->fresh()->balance)->toBe(10.0);
    });

    it('advances next_run_at by the correct interval after running', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);
        $dueAt = now()->subMinute()->startOfMinute();

        $cases = [
            [Frequency::Daily,       fn($d) => $d->copy()->addDay()],
            [Frequency::Weekly,      fn($d) => $d->copy()->addWeek()],
            [Frequency::Fortnightly, fn($d) => $d->copy()->addWeeks(2)],
            [Frequency::Monthly,     fn($d) => $d->copy()->addMonth()],
            [Frequency::Yearly,      fn($d) => $d->copy()->addYear()],
        ];

        foreach ($cases as [$frequency, $expectedNext]) {
            $recurring = RecurringTransaction::factory()->create([
                'account_id'  => $account->id,
                'type'        => TxType::Credit,
                'amount'      => '1.00',
                'frequency'   => $frequency,
                'next_run_at' => $dueAt,
                'is_active'   => true,
                'created_by'  => $user->id,
            ]);

            $this->artisan('recurring:run');

            $expected = $expectedNext($dueAt);
            expect($recurring->fresh()->next_run_at->toDateString())
                ->toBe($expected->toDateString(), "Failed for frequency: {$frequency->value}");
        }
    });
});
