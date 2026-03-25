<?php

use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;
use App\Events\FamilyUpdated;
use App\Events\SpenderUpdated;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Notifications\ChoreApproved;
use App\Notifications\ChoreDeclined;
use App\Notifications\ChoreSubmittedForApproval;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

describe('chore completion notifications from controllers', function () {
    it('notifies parents when a chore is submitted via web', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $child = childLinkedTo($spender);

        $chore = Chore::factory()->create([
            'family_id' => $family->id,
            'requires_approval' => true,
            'is_active' => true,
            'created_by' => $user->id,
        ]);
        $chore->spenders()->attach($spender->id);

        $this->actingAs($child)
            ->post(route('chores.complete', $chore->id), ['spender_id' => $spender->id])
            ->assertRedirect();

        Notification::assertSentTo($user, ChoreSubmittedForApproval::class);
        Event::assertDispatched(FamilyUpdated::class);
    });

    it('notifies spender when a chore is approved via web', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $chore = Chore::factory()->create([
            'family_id' => $family->id,
            'reward_type' => ChoreRewardType::Responsibility,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spender->id,
            'status' => CompletionStatus::Pending,
            'completed_at' => now(),
        ]);

        $this->actingAs($user)
            ->patch(route('chore-completions.approve', $completion->id))
            ->assertRedirect();

        Notification::assertSentTo($spender, ChoreApproved::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('notifies spender when a chore is declined via web', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $chore = Chore::factory()->create([
            'family_id' => $family->id,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spender->id,
            'status' => CompletionStatus::Pending,
            'completed_at' => now(),
        ]);

        $this->actingAs($user)
            ->patch(route('chore-completions.decline', $completion->id))
            ->assertRedirect();

        Notification::assertSentTo($spender, ChoreDeclined::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('notifies spender when a chore is approved via API', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $chore = Chore::factory()->create([
            'family_id' => $family->id,
            'reward_type' => ChoreRewardType::Responsibility,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spender->id,
            'status' => CompletionStatus::Pending,
            'completed_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/chore-completions/{$completion->id}/approve")
            ->assertOk();

        Notification::assertSentTo($spender, ChoreApproved::class);
        Event::assertDispatched(SpenderUpdated::class);
    });

    it('notifies spender when a chore is declined via API', function () {
        Notification::fake();
        Event::fake([FamilyUpdated::class, SpenderUpdated::class]);

        [$user, $family, $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();

        $chore = Chore::factory()->create([
            'family_id' => $family->id,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $completion = ChoreCompletion::create([
            'chore_id' => $chore->id,
            'spender_id' => $spender->id,
            'status' => CompletionStatus::Pending,
            'completed_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/chore-completions/{$completion->id}/decline")
            ->assertOk();

        Notification::assertSentTo($spender, ChoreDeclined::class);
        Event::assertDispatched(SpenderUpdated::class);
    });
});
