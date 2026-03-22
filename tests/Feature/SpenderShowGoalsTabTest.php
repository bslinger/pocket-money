<?php

use App\Models\Account;
use App\Models\SavingsGoal;

test('spender show page includes savings goals with their linked account', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $account = Account::factory()->create(['spender_id' => $spender->id, 'name' => 'Savings', 'balance' => '20.00']);

    SavingsGoal::factory()->create([
        'spender_id' => $spender->id,
        'account_id' => $account->id,
        'name' => 'New Bike',
        'target_amount' => '100.00',
        'is_completed' => false,
        'sort_order' => 0,
    ]);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.savings_goals', 1)
            ->has('spender.savings_goals.0.account')
            ->where('spender.savings_goals.0.account.name', 'Savings')
        );
});

test('spender show page includes goals from multiple accounts', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $savingsAccount = Account::factory()->create(['spender_id' => $spender->id, 'name' => 'Savings']);
    $spendingAccount = Account::factory()->create(['spender_id' => $spender->id, 'name' => 'Spending']);

    SavingsGoal::factory()->create([
        'spender_id' => $spender->id,
        'account_id' => $savingsAccount->id,
        'name' => 'New Bike',
        'target_amount' => '100.00',
        'is_completed' => false,
        'sort_order' => 0,
    ]);

    SavingsGoal::factory()->create([
        'spender_id' => $spender->id,
        'account_id' => $spendingAccount->id,
        'name' => 'LEGO Set',
        'target_amount' => '30.00',
        'is_completed' => false,
        'sort_order' => 0,
    ]);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.savings_goals', 2)
        );
});

test('spender show page includes completed goals alongside active goals', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $account = Account::factory()->create(['spender_id' => $spender->id, 'name' => 'Savings']);

    SavingsGoal::factory()->create([
        'spender_id' => $spender->id,
        'account_id' => $account->id,
        'name' => 'Headphones',
        'target_amount' => '10.00',
        'is_completed' => true,
        'sort_order' => 0,
    ]);

    SavingsGoal::factory()->create([
        'spender_id' => $spender->id,
        'account_id' => $account->id,
        'name' => 'Roller Skates',
        'target_amount' => '45.00',
        'is_completed' => false,
        'sort_order' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.savings_goals', 2)
        );
});
