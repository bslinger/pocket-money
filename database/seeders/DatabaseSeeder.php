<?php

namespace Database\Seeders;

use App\Enums\ChoreFrequency;
use App\Enums\ChoreRewardType;
use App\Enums\CompletionStatus;
use App\Enums\FamilyRole;
use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'ben@example.com'],
            [
                'name'               => 'ben',
                'display_name'       => 'Ben',
                'password'           => bcrypt('test1234'),
                'email_verified_at'  => now(),
            ]
        );

        $family = Family::firstOrCreate(['name' => "Ben's Family"]);

        FamilyUser::firstOrCreate(
            ['family_id' => $family->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );

        $emma = Spender::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Emma'],
            ['color' => '#8b5cf6']
        );

        $jack = Spender::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Jack'],
            ['color' => '#0ea5e9']
        );

        $theodore = Spender::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Theodore'],
            ['color' => '#10b981']
        );

        Account::firstOrCreate(
            ['spender_id' => $emma->id, 'name' => 'Savings'],
            ['balance' => '12.50']
        );

        Account::firstOrCreate(
            ['spender_id' => $jack->id, 'name' => 'Savings'],
            ['balance' => '5.00', ]
        );

        Account::firstOrCreate(
            ['spender_id' => $theodore->id, 'name' => 'Savings'],
            ['balance' => '27.80', ]
        );

        // ── Savings Goals ────────────────────────────────────────────────────

        $emmaAccount   = Account::where('spender_id', $emma->id)->first();
        $jackAccount   = Account::where('spender_id', $jack->id)->first();
        $theoAccount   = Account::where('spender_id', $theodore->id)->first();

        // Emma: two goals on her account — one reached, one not yet
        SavingsGoal::firstOrCreate(
            ['spender_id' => $emma->id, 'name' => 'New headphones'],
            [
                'account_id'    => $emmaAccount?->id,
                'target_amount' => '10.00',
                'target_date'   => null,
                'is_completed'  => true,
            ]
        );

        SavingsGoal::firstOrCreate(
            ['spender_id' => $emma->id, 'name' => 'Roller skates'],
            [
                'account_id'    => $emmaAccount?->id,
                'target_amount' => '45.00',
                'target_date'   => now()->addMonths(3)->toDateString(),
                'is_completed'  => false,
            ]
        );

        // Jack: one in-progress goal
        SavingsGoal::firstOrCreate(
            ['spender_id' => $jack->id, 'name' => 'LEGO set'],
            [
                'account_id'    => $jackAccount?->id,
                'target_amount' => '30.00',
                'target_date'   => now()->addMonths(2)->toDateString(),
                'is_completed'  => false,
            ]
        );

        // Theodore: one goal with no target date
        SavingsGoal::firstOrCreate(
            ['spender_id' => $theodore->id, 'name' => 'Nintendo game'],
            [
                'account_id'    => $theoAccount?->id,
                'target_amount' => '60.00',
                'target_date'   => null,
                'is_completed'  => false,
            ]
        );

        // ── Chores ──────────────────────────────────────────────────────────

        $makebed = Chore::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Make bed'],
            ['emoji' => '🛏️', 'reward_type' => ChoreRewardType::Responsibility, 'frequency' => ChoreFrequency::Daily, 'requires_approval' => false, 'is_active' => true, 'created_by' => $user->id]
        );
        $makebed->spenders()->syncWithoutDetaching([$emma->id, $jack->id]);

        $dishes = Chore::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Wash the dishes'],
            ['emoji' => '🍽️', 'reward_type' => ChoreRewardType::Earns, 'amount' => '1.50', 'frequency' => ChoreFrequency::Daily, 'requires_approval' => true, 'is_active' => true, 'created_by' => $user->id]
        );
        $dishes->spenders()->syncWithoutDetaching([$emma->id, $jack->id, $theodore->id]);

        $vacuum = Chore::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Vacuum the living room'],
            ['emoji' => '🧹', 'reward_type' => ChoreRewardType::Earns, 'amount' => '2.00', 'frequency' => ChoreFrequency::Weekly, 'requires_approval' => true, 'is_active' => true, 'created_by' => $user->id]
        );
        $vacuum->spenders()->syncWithoutDetaching([$emma->id]);

        $bins = Chore::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Take out the bins'],
            ['emoji' => '🗑️', 'reward_type' => ChoreRewardType::Earns, 'amount' => '1.00', 'frequency' => ChoreFrequency::Weekly, 'requires_approval' => true, 'is_active' => true, 'created_by' => $user->id]
        );
        $bins->spenders()->syncWithoutDetaching([$jack->id, $theodore->id]);

        $laundry = Chore::firstOrCreate(
            ['family_id' => $family->id, 'name' => 'Put away laundry'],
            ['emoji' => '👕', 'reward_type' => ChoreRewardType::Responsibility, 'frequency' => ChoreFrequency::Weekly, 'requires_approval' => false, 'is_active' => true, 'created_by' => $user->id]
        );
        $laundry->spenders()->syncWithoutDetaching([$emma->id, $theodore->id]);

        // ── Completions (approved) ───────────────────────────────────────────

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $dishes->id, 'spender_id' => $emma->id, 'completed_at' => now()->subDays(2)->startOfDay()],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->subDays(2), 'reviewed_by' => $user->id]
        );

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $dishes->id, 'spender_id' => $jack->id, 'completed_at' => now()->subDays(1)->startOfDay()],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->subDays(1), 'reviewed_by' => $user->id]
        );

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $bins->id, 'spender_id' => $theodore->id, 'completed_at' => now()->subDays(3)->startOfDay()],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->subDays(3), 'reviewed_by' => $user->id]
        );

        // ── Completions (pending approval) ───────────────────────────────────

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $dishes->id, 'spender_id' => $theodore->id, 'completed_at' => now()->subHours(2)],
            ['status' => CompletionStatus::Pending]
        );

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $vacuum->id, 'spender_id' => $emma->id, 'completed_at' => now()->subHour()],
            ['status' => CompletionStatus::Pending]
        );

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $bins->id, 'spender_id' => $jack->id, 'completed_at' => now()->subMinutes(30)],
            ['status' => CompletionStatus::Pending]
        );

        // Wash the dishes: emma today — not yet submitted (no completion record needed)
        // Make bed: not done by anyone today — no completion record needed
    }
}
