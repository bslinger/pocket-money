<?php

use App\Models\Chore;
use App\Models\ChoreCompletion;

test('chore index includes yesterday completions in weekCompletions', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $chore = Chore::factory()->create([
        'family_id' => $family->id,
        'frequency' => 'daily',
        'is_active'  => true,
    ]);
    $chore->spenders()->attach($spender->id);

    // Create a completion for yesterday
    ChoreCompletion::factory()->create([
        'chore_id'     => $chore->id,
        'spender_id'   => $spender->id,
        'status'       => 'approved',
        'completed_at' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->get(route('chores.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Chores/Index')
            ->has('weekCompletions', 1)
            ->where('weekCompletions.0.chore_id', $chore->id)
        );
});

test('chore index does not include completions older than yesterday', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $chore = Chore::factory()->create([
        'family_id' => $family->id,
        'frequency' => 'daily',
        'is_active'  => true,
    ]);
    $chore->spenders()->attach($spender->id);

    // Create a completion from 2 days ago — should not be included
    ChoreCompletion::factory()->create([
        'chore_id'     => $chore->id,
        'spender_id'   => $spender->id,
        'status'       => 'approved',
        'completed_at' => now()->subDays(2),
    ]);

    $this->actingAs($user)
        ->get(route('chores.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Chores/Index')
            ->has('weekCompletions', 0)
        );
});
