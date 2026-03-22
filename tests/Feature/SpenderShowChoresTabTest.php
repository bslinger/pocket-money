<?php

use App\Enums\ChoreFrequency;
use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;
use App\Models\Chore;
use App\Models\ChoreCompletion;

test('spender show page includes active chores assigned to spender', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $chore = Chore::factory()->create([
        'family_id' => $family->id,
        'name' => 'Make Bed',
        'is_active' => true,
        'reward_type' => ChoreRewardType::Responsibility,
        'frequency' => ChoreFrequency::Daily,
        'created_by' => $user->id,
    ]);
    $chore->spenders()->attach($spender->id);

    $inactiveChore = Chore::factory()->create([
        'family_id' => $family->id,
        'name' => 'Old Chore',
        'is_active' => false,
        'created_by' => $user->id,
    ]);
    $inactiveChore->spenders()->attach($spender->id);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.chores', 1)
            ->where('spender.chores.0.name', 'Make Bed')
        );
});

test('spender show page does not include chores not assigned to the spender', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);
    $emma = $spenders->first();
    $jack = $spenders->last();

    $jackChore = Chore::factory()->create([
        'family_id' => $family->id,
        'name' => 'Take Out Bins',
        'is_active' => true,
        'created_by' => $user->id,
    ]);
    $jackChore->spenders()->attach($jack->id);

    $this->actingAs($user)
        ->get(route('spenders.show', $emma->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.chores', 0)
        );
});

test('spender show page includes recent chore completions with chore relationship', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $chore = Chore::factory()->create([
        'family_id' => $family->id,
        'name' => 'Wash Dishes',
        'is_active' => true,
        'created_by' => $user->id,
    ]);
    $chore->spenders()->attach($spender->id);

    ChoreCompletion::factory()->create([
        'chore_id' => $chore->id,
        'spender_id' => $spender->id,
        'status' => CompletionStatus::Approved,
        'completed_at' => now()->subHour(),
        'reviewed_at' => now()->subMinutes(30),
        'reviewed_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.chore_completions', 1)
            ->has('spender.chore_completions.0.chore')
            ->where('spender.chore_completions.0.chore.name', 'Wash Dishes')
        );
});

test('spender show page includes pending chore completions', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $chore = Chore::factory()->create([
        'family_id' => $family->id,
        'name' => 'Vacuum',
        'is_active' => true,
        'created_by' => $user->id,
    ]);
    $chore->spenders()->attach($spender->id);

    ChoreCompletion::factory()->create([
        'chore_id' => $chore->id,
        'spender_id' => $spender->id,
        'status' => CompletionStatus::Pending,
        'completed_at' => now()->subMinutes(10),
    ]);

    $this->actingAs($user)
        ->get(route('spenders.show', $spender->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Spenders/Show')
            ->has('spender.chore_completions', 1)
            ->where('spender.chore_completions.0.status', CompletionStatus::Pending)
        );
});
