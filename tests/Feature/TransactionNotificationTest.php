<?php

use App\Events\FamilyUpdated;
use App\Events\SpenderUpdated;
use App\Models\Account;
use App\Notifications\TransactionRecorded;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

describe('transaction notifications and broadcasts', function () {
    it('sends notification and broadcasts when a transaction is created (web)', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        $this->actingAs($user)
            ->post(route('accounts.transactions.store', $account->id), [
                'type' => 'credit',
                'amount' => '5.00',
                'description' => 'Test deposit',
                'occurred_at' => now()->toDateTimeString(),
            ])
            ->assertRedirect();

        Notification::assertSentTo($spender, TransactionRecorded::class);
        Event::assertDispatched(FamilyUpdated::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('sends notification when a transaction is created (API)', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/accounts/{$account->id}/transactions", [
                'type' => 'debit',
                'amount' => '3.00',
                'description' => 'Test withdrawal',
                'occurred_at' => now()->toIso8601String(),
            ])
            ->assertCreated();

        Notification::assertSentTo($spender, TransactionRecorded::class);
        Event::assertDispatched(FamilyUpdated::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('sends notification when a transaction is updated (web)', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '10.00']);
        $transaction = $account->transactions()->create([
            'type' => 'credit',
            'amount' => '5.00',
            'description' => 'Original',
            'occurred_at' => now(),
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->put(route('accounts.transactions.update', [$account->id, $transaction->id]), [
                'type' => 'credit',
                'amount' => '7.00',
                'description' => 'Updated',
                'occurred_at' => now()->toDateTimeString(),
            ])
            ->assertRedirect();

        Notification::assertSentTo($spender, TransactionRecorded::class);
        Event::assertDispatched(FamilyUpdated::class);
    });

    it('sends notification when a transaction is deleted (web)', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '10.00']);
        $transaction = $account->transactions()->create([
            'type' => 'credit',
            'amount' => '5.00',
            'description' => 'To delete',
            'occurred_at' => now(),
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->delete(route('accounts.transactions.destroy', [$account->id, $transaction->id]))
            ->assertRedirect();

        Notification::assertSentTo($spender, TransactionRecorded::class);
        Event::assertDispatched(FamilyUpdated::class);
    });
});
