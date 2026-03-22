<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\PocketMoneySchedule;
use App\Models\Transaction;

describe('pocket money release', function () {

    it('shows the release page with spenders', function () {
        [$user] = parentWithFamily(['Emma', 'Jack']);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('PocketMoney/Release')
                ->has('spenders', 2)
            );
    });

    it('shows active pocket money schedules for each spender', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        PocketMoneySchedule::factory()->weekly(5.00)->create([
            'spender_id' => $spender->id,
            'account_id' => $account->id,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertInertia(fn ($page) => $page
                ->has('spenders.0.schedules', 1)
                ->where('spenders.0.schedules.0.frequency', 'weekly')
                ->where('spenders.0.schedules.0.amount', '5.00')
            );
    });

    it('marks paid_this_week as true when pocket money paid this week', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        PocketMoneySchedule::factory()->weekly(5.00)->create([
            'spender_id' => $spender->id,
            'account_id' => $account->id,
            'created_by' => $user->id,
        ]);

        Transaction::factory()->create([
            'account_id'  => $account->id,
            'type'        => 'credit',
            'amount'      => '5.00',
            'description' => 'Pocket money',
            'occurred_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertInertia(fn ($page) => $page
                ->where('spenders.0.paid_this_week', true)
                ->has('spenders.0.this_week_payments', 1)
            );
    });

    it('marks withheld as true when schedule exists and responsibilities unmet', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        PocketMoneySchedule::factory()->weekly(10.00)->create([
            'spender_id' => $spender->id,
            'account_id' => $account->id,
            'created_by' => $user->id,
        ]);

        $chore = Chore::factory()->create(['reward_type' => 'responsibility', 'is_active' => true]);
        $spender->chores()->attach($chore->id);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertInertia(fn ($page) => $page
                ->where('spenders.0.withheld', true)
                ->where('spenders.0.withheld_amount', '10.00')
                ->has('spenders.0.unmet_responsibilities', 1)
            );
    });

    it('does not mark withheld when responsibilities are met', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        PocketMoneySchedule::factory()->weekly(10.00)->create([
            'spender_id' => $spender->id,
            'account_id' => $account->id,
            'created_by' => $user->id,
        ]);

        $chore = Chore::factory()->create(['reward_type' => 'responsibility', 'is_active' => true]);
        $spender->chores()->attach($chore->id);

        ChoreCompletion::factory()->create([
            'spender_id'   => $spender->id,
            'chore_id'     => $chore->id,
            'status'       => 'approved',
            'completed_at' => now()->startOfWeek()->addDay(),
        ]);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertInertia(fn ($page) => $page
                ->where('spenders.0.withheld', false)
                ->where('spenders.0.responsibility_chores_done', 1)
            );
    });

    it('shows recent pocket money transaction history', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        Transaction::factory()->count(3)->create([
            'account_id'  => $account->id,
            'type'        => 'credit',
            'amount'      => '5.00',
            'description' => 'Pocket money',
            'occurred_at' => now()->subWeeks(2),
        ]);

        $this->actingAs($user)
            ->get(route('pocket-money.release'))
            ->assertInertia(fn ($page) => $page
                ->has('spenders.0.recent_transactions', 3)
            );
    });

    it('pays pocket money and credits the main account', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

        $this->actingAs($user)
            ->post(route('pocket-money.pay'), [
                'spender_id' => $spender->id,
                'amount'     => '5.00',
            ])
            ->assertRedirect();

        expect((float) $account->fresh()->balance)->toBe(5.0);

        $tx = Transaction::where('account_id', $account->id)->first();
        expect($tx->description)->toBe('Pocket money');
        expect($tx->type->value)->toBe('credit');
    });

    it('validates amount must be at least 0.01', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);

        $this->actingAs($user)
            ->post(route('pocket-money.pay'), [
                'spender_id' => $spenders->first()->id,
                'amount'     => '0',
            ])
            ->assertSessionHasErrors('amount');
    });

    it('requires parent role', function () {
        [$_user, , $spenders] = parentWithFamily(['Emma']);
        $child = childLinkedTo($spenders->first());

        $this->actingAs($child)
            ->post(route('pocket-money.pay'), ['spender_id' => $spenders->first()->id, 'amount' => '5.00'])
            ->assertForbidden();
    });
});
