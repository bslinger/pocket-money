<?php

use App\Models\Account;
use App\Models\PocketMoneyEvent;
use App\Models\PocketMoneySchedule;
use App\Models\SavingsGoal;
use App\Services\CatchupService;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\HttpKernel\Exception\HttpException;

// ---------------------------------------------------------------------------
// CatchupService::buildForUser()
// ---------------------------------------------------------------------------

describe('CatchupService::buildForUser', function () {

    it('returns empty when user has no last_catchup_at', function () {
        [$user] = parentWithFamily(['Emma']);

        $service = app(CatchupService::class);
        $result = $service->buildForUser($user);

        expect($result['has_events'])->toBeFalse()
            ->and($result['spenders'])->toBeEmpty();
    });

    it('returns empty when no events since last catchup', function () {
        [$user] = parentWithFamily(['Emma']);
        $user->update(['last_catchup_at' => now()->subHour()]);

        $service = app(CatchupService::class);
        $result = $service->buildForUser($user);

        expect($result['has_events'])->toBeFalse();
    });

    it('returns pocket money events since last catchup', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $user->update(['last_catchup_at' => now()->subHour()]);

        PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->subDay()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $service = app(CatchupService::class);
        $result = $service->buildForUser($user);

        expect($result['has_events'])->toBeTrue()
            ->and($result['spenders'])->toHaveCount(1)
            ->and($result['spenders'][0]['pocket_money_events'])->toHaveCount(1)
            ->and($result['spenders'][0]['pocket_money_events'][0]['status'])->toBe('withheld')
            ->and($result['spenders'][0]['pocket_money_events'][0]['amount'])->toBe('5.00');
    });

    it('excludes events created before last catchup', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $user->update(['last_catchup_at' => now()]);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->subWeek()->toDateString(),
            'amount' => '5.00',
            'status' => 'released',
            'transaction_id' => null,
        ]);
        $event->forceFill(['created_at' => now()->subHour()])->saveQuietly();

        $service = app(CatchupService::class);
        $result = $service->buildForUser($user);

        expect($result['has_events'])->toBeFalse();
    });

    it('returns goals met since last catchup', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $user->update(['last_catchup_at' => now()->subHour()]);

        SavingsGoal::factory()->create([
            'spender_id' => $spender->id,
            'name' => 'New Bike',
            'target_amount' => '50.00',
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        $service = app(CatchupService::class);
        $result = $service->buildForUser($user);

        expect($result['has_events'])->toBeTrue()
            ->and($result['spenders'][0]['goals_met'])->toHaveCount(1)
            ->and($result['spenders'][0]['goals_met'][0]['name'])->toBe('New Bike');
    });

    it('excludes spenders from other families', function () {
        [$user] = parentWithFamily(['Emma']);
        [, , $otherSpenders] = parentWithFamily(['Jack']);
        $otherSpender = $otherSpenders->first();
        $user->update(['last_catchup_at' => now()->subHour()]);

        PocketMoneyEvent::create([
            'spender_id' => $otherSpender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'released',
            'transaction_id' => null,
        ]);

        $service = app(CatchupService::class);
        $result = $service->buildForUser($user);

        expect($result['has_events'])->toBeFalse();
    });

});

// ---------------------------------------------------------------------------
// CatchupService::release() and reverse()
// ---------------------------------------------------------------------------

describe('CatchupService release and reverse', function () {

    it('releases a withheld event and creates a credit transaction', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '0.00']);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->subDay()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $service = app(CatchupService::class);
        $result = $service->release($event, $user);

        expect($result->status)->toBe('released')
            ->and($result->transaction_id)->not->toBeNull();

        $this->assertDatabaseHas('transactions', [
            'account_id' => $account->id,
            'type' => 'credit',
            'amount' => '5.00',
        ]);

        expect((float) $account->fresh()->balance)->toBe(5.0);
    });

    it('aborts when releasing an already-released event', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id]);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'released',
            'transaction_id' => null,
        ]);

        $service = app(CatchupService::class);

        expect(fn () => $service->release($event, $user))
            ->toThrow(HttpException::class);
    });

    it('reverses a released event and creates a debit transaction', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id, 'balance' => '10.00']);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->subDay()->toDateString(),
            'amount' => '5.00',
            'status' => 'released',
            'transaction_id' => null,
        ]);

        $service = app(CatchupService::class);
        $result = $service->reverse($event, $user);

        expect($result->status)->toBe('withheld')
            ->and($result->transaction_id)->toBeNull();

        $this->assertDatabaseHas('transactions', [
            'account_id' => $account->id,
            'type' => 'debit',
            'amount' => '5.00',
        ]);

        expect((float) $account->fresh()->balance)->toBe(5.0);
    });

    it('aborts when reversing a withheld event', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id]);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $service = app(CatchupService::class);

        expect(fn () => $service->reverse($event, $user))
            ->toThrow(HttpException::class);
    });

});

// ---------------------------------------------------------------------------
// Web catchup routes
// ---------------------------------------------------------------------------

describe('web catchup routes', function () {

    it('releases an event via web route', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id]);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $this->actingAs($user)
            ->post(route('catchup.release', $event->id))
            ->assertRedirect();

        expect($event->fresh()->status)->toBe('released');
    });

    it('reverses an event via web route', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id, 'balance' => '10.00']);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'released',
            'transaction_id' => null,
        ]);

        $this->actingAs($user)
            ->post(route('catchup.reverse', $event->id))
            ->assertRedirect();

        expect($event->fresh()->status)->toBe('withheld');
    });

    it('forbids releasing another family event via web route', function () {
        [$user] = parentWithFamily(['Emma']);
        [, , $otherSpenders] = parentWithFamily(['Jack']);
        $otherSpender = $otherSpenders->first();
        Account::factory()->create(['spender_id' => $otherSpender->id]);

        $event = PocketMoneyEvent::create([
            'spender_id' => $otherSpender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $this->actingAs($user)
            ->post(route('catchup.release', $event->id))
            ->assertForbidden();
    });

});

// ---------------------------------------------------------------------------
// API catchup routes
// ---------------------------------------------------------------------------

describe('API catchup', function () {

    it('returns catchup data for an authenticated parent', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $user->update(['last_catchup_at' => now()->subHour()]);

        PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/catchup')
            ->assertOk()
            ->assertJsonPath('data.has_events', true)
            ->assertJsonCount(1, 'data.spenders');
    });

    it('releases an event via API', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id]);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/catchup/pocket-money-events/{$event->id}/release")
            ->assertOk()
            ->assertJsonPath('data.status', 'released');
    });

    it('reverses an event via API', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->create(['spender_id' => $spender->id, 'balance' => '10.00']);

        $event = PocketMoneyEvent::create([
            'spender_id' => $spender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'released',
            'transaction_id' => null,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/catchup/pocket-money-events/{$event->id}/reverse")
            ->assertOk()
            ->assertJsonPath('data.status', 'withheld');
    });

    it('forbids releasing another family event via API', function () {
        [$user] = parentWithFamily(['Emma']);
        [, , $otherSpenders] = parentWithFamily(['Jack']);
        $otherSpender = $otherSpenders->first();

        $event = PocketMoneyEvent::create([
            'spender_id' => $otherSpender->id,
            'scheduled_for' => now()->toDateString(),
            'amount' => '5.00',
            'status' => 'withheld',
            'transaction_id' => null,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/catchup/pocket-money-events/{$event->id}/release")
            ->assertForbidden();
    });

});

// ---------------------------------------------------------------------------
// RunPocketMoney event logging
// ---------------------------------------------------------------------------

describe('RunPocketMoney logs PocketMoneyEvents', function () {

    it('creates a released event when pocket money is paid', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);

        PocketMoneySchedule::factory()->due()->create([
            'spender_id' => $spender->id,
            'account_id' => $account->id,
            'amount' => '5.00',
            'created_by' => $user->id,
        ]);

        Artisan::call('pocket-money:run');

        $this->assertDatabaseHas('pocket_money_events', [
            'spender_id' => $spender->id,
            'amount' => '5.00',
            'status' => 'released',
        ]);
    });

});
