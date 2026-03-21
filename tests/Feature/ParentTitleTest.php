<?php

use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Enums\ChoreFrequency;
use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;

describe('parent title', function () {

    describe('profile update', function () {
        it('saves parent_title via profile route', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->patch(route('profile.update'), [
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'parent_title' => 'Mum',
                ])
                ->assertRedirect();

            expect($user->fresh()->parent_title)->toBe('Mum');
        });

        it('saves a custom parent_title via profile route', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->patch(route('profile.update'), [
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'parent_title' => 'Oma',
                ])
                ->assertRedirect();

            expect($user->fresh()->parent_title)->toBe('Oma');
        });

        it('clears parent_title when empty', function () {
            [$user] = parentWithFamily();
            $user->update(['parent_title' => 'Dad']);

            $this->actingAs($user)
                ->patch(route('profile.update'), [
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'parent_title' => '',
                ])
                ->assertRedirect();

            expect($user->fresh()->parent_title)->toBeNull();
        });
    });

    describe('settings update', function () {
        it('saves parent_title via settings route', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->patch(route('settings.profile.update'), [
                    'display_name' => null,
                    'parent_title' => 'Papa',
                    'email'        => $user->email,
                    'avatar_url'   => null,
                ])
                ->assertRedirect();

            expect($user->fresh()->parent_title)->toBe('Papa');
        });
    });

    describe('dashboard kid view', function () {
        it('uses parent_title in declined completion reviewer name', function () {
            [$parent, $family, $spenders] = parentWithFamily(['Emma']);
            $parent->update(['parent_title' => 'Mum']);
            $spender = $spenders->first();
            $child   = childLinkedTo($spender);

            $chore = Chore::factory()->create([
                'family_id'   => $family->id,
                'reward_type' => ChoreRewardType::Responsibility,
                'frequency'   => ChoreFrequency::Daily,
                'is_active'   => true,
                'created_by'  => $parent->id,
            ]);
            $chore->spenders()->attach($spender->id);

            ChoreCompletion::factory()->create([
                'chore_id'    => $chore->id,
                'spender_id'  => $spender->id,
                'status'      => CompletionStatus::Declined,
                'completed_at' => now()->startOfWeek()->addHours(10),
                'reviewed_at' => now()->startOfWeek()->addHours(11),
                'reviewed_by' => $parent->id,
            ]);

            $response = $this->actingAs($child)
                ->get(route('dashboard'))
                ->assertOk();

            // The reviewer's parent_title should be included in the chore completion data
            $spenders = $response->original->getData()['page']['props']['spenders'];
            $completion = collect($spenders)->flatMap(fn($s) => $s['chore_completions'])->first();

            expect($completion['reviewer']['parent_title'])->toBe('Mum');
        });

        it('falls back to reviewer name when parent_title is not set', function () {
            [$parent, $family, $spenders] = parentWithFamily(['Emma']);
            $parent->update(['parent_title' => null]);
            $spender = $spenders->first();
            $child   = childLinkedTo($spender);

            $chore = Chore::factory()->create([
                'family_id'   => $family->id,
                'reward_type' => ChoreRewardType::Responsibility,
                'frequency'   => ChoreFrequency::Daily,
                'is_active'   => true,
                'created_by'  => $parent->id,
            ]);
            $chore->spenders()->attach($spender->id);

            ChoreCompletion::factory()->create([
                'chore_id'    => $chore->id,
                'spender_id'  => $spender->id,
                'status'      => CompletionStatus::Declined,
                'completed_at' => now()->startOfWeek()->addHours(10),
                'reviewed_at' => now()->startOfWeek()->addHours(11),
                'reviewed_by' => $parent->id,
            ]);

            $response = $this->actingAs($child)
                ->get(route('dashboard'))
                ->assertOk();

            $spenders = $response->original->getData()['page']['props']['spenders'];
            $completion = collect($spenders)->flatMap(fn($s) => $s['chore_completions'])->first();

            expect($completion['reviewer']['parent_title'])->toBeNull();
            expect($completion['reviewer']['name'])->toBe($parent->name);
        });
    });
});
