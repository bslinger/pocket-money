<?php

use App\Models\Account;

test('spenders index page loads with account data', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    Account::factory()->create(['spender_id' => $spender->id, 'name' => 'Spending', 'balance' => '5.00']);
    Account::factory()->create(['spender_id' => $spender->id, 'name' => 'Savings', 'balance' => '20.00']);

    $this->actingAs($user)
        ->get(route('spenders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Index')
            ->has('spenders', 1)
            ->has('spenders.0.accounts', 2)
        );
});
