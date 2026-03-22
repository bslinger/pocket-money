<?php

use App\Enums\FamilyRole;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\Spender;
use App\Models\SpenderUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => $this->withoutVite())
    ->in('Feature', 'Unit');

// --- Helpers ---

/**
 * Create a parent user with a family and optional spenders.
 */
function parentWithFamily(array $spenderNames = []): array
{
    $user = User::factory()->create();
    $family = Family::factory()->create(['billing_user_id' => $user->id]);
    FamilyUser::create(['family_id' => $family->id, 'user_id' => $user->id, 'role' => FamilyRole::Admin]);
    $family->grantTrialIfEligible($user);

    $spenders = collect($spenderNames)->map(
        fn ($name) => Spender::factory()->create(['family_id' => $family->id, 'name' => $name])
    );

    return [$user, $family, $spenders];
}

/**
 * Create a child user linked to a spender.
 */
function childLinkedTo(Spender $spender): User
{
    $child = User::factory()->create();
    SpenderUser::create(['spender_id' => $spender->id, 'user_id' => $child->id]);

    return $child;
}
