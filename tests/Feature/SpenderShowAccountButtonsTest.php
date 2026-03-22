<?php

use App\Models\Account;

test('spender show page loads for parent', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();
    Account::factory()->create(['spender_id' => $spender->id, 'balance' => '10.00']);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender')
            ->where('spender.id', $spender->id)
        );
});

test('spender show page includes family on spender', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->where('spender.family_id', $family->id)
        );
});

test('parent can add money to an account from spender page', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();
    $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '0.00']);

    $this->actingAs($user)
        ->post(route('accounts.transactions.store', $account->id), [
            'type' => 'credit',
            'amount' => '15.00',
            'description' => 'Birthday money',
            'occurred_at' => now()->toISOString(),
        ])
        ->assertRedirect();

    expect($account->fresh()->balance)->toEqual('15.00');
});

test('parent can spend from an account from spender page', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();
    $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '20.00']);

    $this->actingAs($user)
        ->post(route('accounts.transactions.store', $account->id), [
            'type' => 'debit',
            'amount' => '5.00',
            'description' => 'Toy purchase',
            'occurred_at' => now()->toISOString(),
        ])
        ->assertRedirect();

    expect($account->fresh()->balance)->toEqual('15.00');
});
