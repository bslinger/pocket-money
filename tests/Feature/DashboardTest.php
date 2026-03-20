<?php

use App\Models\Account;
use App\Models\ChoreCompletion;
use App\Models\Chore;
use App\Models\Transaction;
use App\Models\User;
use App\Enums\CompletionStatus;

describe('dashboard', function () {

    it('shows parent dashboard with families and pending completions', function () {
        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->create(['spender_id' => $spender->id]);
        $chore   = Chore::factory()->create(['family_id' => $family->id, 'created_by' => $user->id]);
        ChoreCompletion::factory()->create([
            'chore_id'   => $chore->id,
            'spender_id' => $spender->id,
            'status'     => CompletionStatus::Pending,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('Dashboard')
                ->where('isParent', true)
                ->has('families', 1)
                ->has('pendingCompletions', 1)
            );
    });

    it('calculates totalBalance across all accounts', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        Account::factory()->withBalance(30)->create(['spender_id' => $spender->id]);
        Account::factory()->withBalance(100)->create(['spender_id' => $spender->id]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn($page) => $page->where('totalBalance', '130.00'));
    });

    it('calculates paidThisMonth from current month credits', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $account = Account::factory()->withBalance(50)->create(['spender_id' => $spender->id]);

        Transaction::factory()->credit()->create([
            'account_id'  => $account->id,
            'amount'      => 20,
            'occurred_at' => now(),
        ]);
        // Last month — should not count
        Transaction::factory()->credit()->create([
            'account_id'  => $account->id,
            'amount'      => 999,
            'occurred_at' => now()->subMonth(),
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn($page) => $page->where('paidThisMonth', '20.00'));
    });

    it('shows child dashboard for a child user', function () {
        [$_user, , $spenders] = parentWithFamily(['Emma']);
        $child = childLinkedTo($spenders->first());

        $this->actingAs($child)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn($page) => $page
                ->component('Dashboard')
                ->where('isParent', false)
                ->has('spenders', 1)
            );
    });

    it('requires authentication', function () {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    });

    it('is accessible to unverified users (no email gate on this route)', function () {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk();
    });
});
