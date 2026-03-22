<?php

use App\Models\Account;

test('splits a credit across multiple accounts', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $account1 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);
    $account2 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

    $this->actingAs($user)
        ->post(route('transactions.split'), [
            'description' => 'Christmas money',
            'occurred_at' => now()->toISOString(),
            'splits' => [
                ['account_id' => $account1->id, 'amount' => 75],
                ['account_id' => $account2->id, 'amount' => 25],
            ],
        ])
        ->assertRedirect(route('dashboard'));

    expect($account1->fresh()->balance)->toEqual('75.00');
    expect($account2->fresh()->balance)->toEqual('25.00');
    expect($account1->transactions()->count())->toBe(1);
    expect($account2->transactions()->count())->toBe(1);
});

test('all split transactions share the same description', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $account1 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);
    $account2 = Account::factory()->create(['spender_id' => $spender->id, 'balance' => 0]);

    $this->actingAs($user)
        ->post(route('transactions.split'), [
            'description' => 'Birthday money',
            'occurred_at' => now()->toISOString(),
            'splits' => [
                ['account_id' => $account1->id, 'amount' => 50],
                ['account_id' => $account2->id, 'amount' => 50],
            ],
        ]);

    expect($account1->transactions()->first()->description)->toBe('Birthday money');
    expect($account2->transactions()->first()->description)->toBe('Birthday money');
});

test('rejects split transactions to accounts not owned by the parent', function () {
    [$user] = parentWithFamily(['Emma']);
    [$_other, , $otherSpenders] = parentWithFamily(['Jack']);
    $foreignAccount = Account::factory()->create(['spender_id' => $otherSpenders->first()->id]);

    [$_u, , $spenders] = parentWithFamily(['Emma2'], $user);
    $ownAccount = Account::factory()->create(['spender_id' => $spenders->first()->id]);

    $this->actingAs($user)
        ->post(route('transactions.split'), [
            'description' => 'Test',
            'occurred_at' => now()->toISOString(),
            'splits' => [
                ['account_id' => $ownAccount->id, 'amount' => 50],
                ['account_id' => $foreignAccount->id, 'amount' => 50],
            ],
        ])
        ->assertStatus(404);
});

test('requires at least two split entries', function () {
    [$user, , $spenders] = parentWithFamily(['Emma']);
    $account = Account::factory()->create(['spender_id' => $spenders->first()->id]);

    $this->actingAs($user)
        ->post(route('transactions.split'), [
            'description' => 'Test',
            'occurred_at' => now()->toISOString(),
            'splits' => [
                ['account_id' => $account->id, 'amount' => 100],
            ],
        ])
        ->assertSessionHasErrors('splits');
});
