<?php

use App\Models\Account;
use App\Models\SavingsGoal;

test('goal show page includes linked account data', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();
    $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '25.00']);
    $goal = SavingsGoal::factory()->create([
        'spender_id'    => $spender->id,
        'account_id'    => $account->id,
        'target_amount' => '50.00',
    ]);

    $this->actingAs($user)
        ->get(route('goals.show', $goal->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Goals/Show')
            ->where('goal.account.id', $account->id)
            ->where('goal.account.balance', '25.00')
        );
});

test('goal show page works when no account is linked', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();
    $goal = SavingsGoal::factory()->create([
        'spender_id'    => $spender->id,
        'account_id'    => null,
        'target_amount' => '30.00',
    ]);

    $this->actingAs($user)
        ->get(route('goals.show', $goal->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Goals/Show')
            ->where('goal.account', null)
        );
});
