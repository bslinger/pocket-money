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
use App\Models\PocketMoneySchedule;
use App\Models\SavingsGoal;
use App\Models\Spender;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'ben@example.com'],
            [
                'name' => 'ben',
                'display_name' => 'Ben',
                'password' => bcrypt('test1234'),
                'email_verified_at' => now(),
            ]
        );

        $family = Family::firstOrCreate(
            ['name' => "Ben's Family"],
            ['billing_user_id' => $user->id]
        );
        if (! $family->billing_user_id) {
            $family->update(['billing_user_id' => $user->id]);
        }

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
            ['balance' => '5.00']
        );

        Account::firstOrCreate(
            ['spender_id' => $theodore->id, 'name' => 'Savings'],
            ['balance' => '27.80']
        );

        // ── Savings Goals ────────────────────────────────────────────────────

        $emmaAccount = Account::where('spender_id', $emma->id)->first();
        $jackAccount = Account::where('spender_id', $jack->id)->first();
        $theoAccount = Account::where('spender_id', $theodore->id)->first();

        // Emma: two goals on her account — one reached, one not yet (priority order: headphones first)
        SavingsGoal::firstOrCreate(
            ['spender_id' => $emma->id, 'name' => 'New headphones'],
            [
                'account_id' => $emmaAccount?->id,
                'target_amount' => '10.00',
                'target_date' => null,
                'is_completed' => true,
                'sort_order' => 0,
            ]
        );

        SavingsGoal::firstOrCreate(
            ['spender_id' => $emma->id, 'name' => 'Roller skates'],
            [
                'account_id' => $emmaAccount?->id,
                'target_amount' => '45.00',
                'target_date' => now()->addMonths(3)->toDateString(),
                'is_completed' => false,
                'sort_order' => 1,
            ]
        );

        // Jack: one in-progress goal
        SavingsGoal::firstOrCreate(
            ['spender_id' => $jack->id, 'name' => 'LEGO set'],
            [
                'account_id' => $jackAccount?->id,
                'target_amount' => '30.00',
                'target_date' => now()->addMonths(2)->toDateString(),
                'is_completed' => false,
                'sort_order' => 0,
            ]
        );

        // Theodore: one goal with no target date
        SavingsGoal::firstOrCreate(
            ['spender_id' => $theodore->id, 'name' => 'Nintendo game'],
            [
                'account_id' => $theoAccount?->id,
                'target_amount' => '60.00',
                'target_date' => null,
                'is_completed' => false,
                'sort_order' => 0,
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

        // ── Completions (declined) ───────────────────────────────────────────

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $dishes->id, 'spender_id' => $emma->id, 'completed_at' => now()->subHours(5)],
            ['status' => CompletionStatus::Declined, 'reviewed_at' => now()->subHours(4), 'reviewed_by' => $user->id]
        );

        ChoreCompletion::firstOrCreate(
            ['chore_id' => $vacuum->id, 'spender_id' => $jack->id, 'completed_at' => now()->subHours(3)],
            ['status' => CompletionStatus::Declined, 'reviewed_at' => now()->subHours(2), 'reviewed_by' => $user->id]
        );

        // ── Past week completions (for schedule history testing) ─────────

        // Daily chores: make bed + dishes over the past 7 days
        foreach (range(2, 7) as $daysAgo) {
            $day = now()->subDays($daysAgo)->startOfDay();

            // Emma: made bed every day, did dishes most days
            ChoreCompletion::firstOrCreate(
                ['chore_id' => $makebed->id, 'spender_id' => $emma->id, 'completed_at' => $day->copy()->addHours(7)],
                ['status' => CompletionStatus::Approved, 'reviewed_at' => $day->copy()->addHours(8), 'reviewed_by' => $user->id]
            );
            if ($daysAgo !== 4) { // skipped dishes 4 days ago
                ChoreCompletion::firstOrCreate(
                    ['chore_id' => $dishes->id, 'spender_id' => $emma->id, 'completed_at' => $day->copy()->addHours(18)],
                    ['status' => CompletionStatus::Approved, 'reviewed_at' => $day->copy()->addHours(19), 'reviewed_by' => $user->id]
                );
            }

            // Jack: made bed some days, did dishes occasionally
            if ($daysAgo % 2 === 0) {
                ChoreCompletion::firstOrCreate(
                    ['chore_id' => $makebed->id, 'spender_id' => $jack->id, 'completed_at' => $day->copy()->addHours(8)],
                    ['status' => CompletionStatus::Approved, 'reviewed_at' => $day->copy()->addHours(9), 'reviewed_by' => $user->id]
                );
            }
            if ($daysAgo >= 5) {
                ChoreCompletion::firstOrCreate(
                    ['chore_id' => $dishes->id, 'spender_id' => $jack->id, 'completed_at' => $day->copy()->addHours(19)],
                    ['status' => CompletionStatus::Approved, 'reviewed_at' => $day->copy()->addHours(20), 'reviewed_by' => $user->id]
                );
            }

            // Theodore: did dishes most days
            if ($daysAgo !== 6) {
                ChoreCompletion::firstOrCreate(
                    ['chore_id' => $dishes->id, 'spender_id' => $theodore->id, 'completed_at' => $day->copy()->addHours(17)],
                    ['status' => $daysAgo === 3 ? CompletionStatus::Declined : CompletionStatus::Approved,
                        'reviewed_at' => $day->copy()->addHours(18), 'reviewed_by' => $user->id]
                );
            }
        }

        // Weekly chores scattered through the past week
        ChoreCompletion::firstOrCreate(
            ['chore_id' => $vacuum->id, 'spender_id' => $emma->id, 'completed_at' => now()->subDays(5)->startOfDay()->addHours(10)],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->subDays(5)->startOfDay()->addHours(11), 'reviewed_by' => $user->id]
        );
        ChoreCompletion::firstOrCreate(
            ['chore_id' => $bins->id, 'spender_id' => $jack->id, 'completed_at' => now()->subDays(4)->startOfDay()->addHours(16)],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->subDays(4)->startOfDay()->addHours(17), 'reviewed_by' => $user->id]
        );
        ChoreCompletion::firstOrCreate(
            ['chore_id' => $laundry->id, 'spender_id' => $theodore->id, 'completed_at' => now()->subDays(6)->startOfDay()->addHours(14)],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->subDays(6)->startOfDay()->addHours(15), 'reviewed_by' => $user->id]
        );

        // ── Second family: Pocket Money Scheduler Test ───────────────────────
        // Designed to exercise the pocket-money:run command in all scenarios.

        $testFamily = Family::firstOrCreate(
            ['name' => 'Scheduler Test Family'],
            ['billing_user_id' => $user->id]
        );
        if (! $testFamily->billing_user_id) {
            $testFamily->update(['billing_user_id' => $user->id]);
        }

        FamilyUser::firstOrCreate(
            ['family_id' => $testFamily->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );

        // --- Scenario A: pocket money due, no responsibility chores → auto-pays ---
        $alice = Spender::firstOrCreate(
            ['family_id' => $testFamily->id, 'name' => 'Alice'],
            ['color' => '#22c55e']
        );
        $aliceAccount = Account::firstOrCreate(
            ['spender_id' => $alice->id, 'name' => 'Savings'],
            ['balance' => '5.00']
        );
        PocketMoneySchedule::firstOrCreate(
            ['spender_id' => $alice->id],
            [
                'account_id' => $aliceAccount->id,
                'amount' => '5.00',
                'frequency' => 'weekly',
                'day_of_week' => now()->dayOfWeek,
                'is_active' => true,
                'next_run_at' => now()->subMinutes(1), // overdue — will pay next run
                'created_by' => $user->id,
            ]
        );

        // --- Scenario B: pocket money due, has responsibility chore, NOT completed → withheld ---
        $bob = Spender::firstOrCreate(
            ['family_id' => $testFamily->id, 'name' => 'Bob'],
            ['color' => '#f97316']
        );
        $bobAccount = Account::firstOrCreate(
            ['spender_id' => $bob->id, 'name' => 'Savings'],
            ['balance' => '2.00']
        );

        $bobResponsibility = Chore::firstOrCreate(
            ['family_id' => $testFamily->id, 'name' => 'Tidy bedroom'],
            [
                'emoji' => '🧹',
                'reward_type' => ChoreRewardType::Responsibility,
                'frequency' => ChoreFrequency::Weekly,
                'requires_approval' => false,
                'is_active' => true,
                'created_by' => $user->id,
            ]
        );
        $bobResponsibility->spenders()->syncWithoutDetaching([$bob->id]);
        // No completion record — Bob hasn't done his chore yet

        PocketMoneySchedule::firstOrCreate(
            ['spender_id' => $bob->id],
            [
                'account_id' => $bobAccount->id,
                'amount' => '4.00',
                'frequency' => 'weekly',
                'day_of_week' => now()->dayOfWeek,
                'is_active' => true,
                'next_run_at' => now()->subMinutes(1), // overdue — will be withheld
                'created_by' => $user->id,
            ]
        );

        // --- Scenario C: pocket money due, has responsibility chore, IS completed → auto-pays ---
        $carol = Spender::firstOrCreate(
            ['family_id' => $testFamily->id, 'name' => 'Carol'],
            ['color' => '#8b5cf6']
        );
        $carolAccount = Account::firstOrCreate(
            ['spender_id' => $carol->id, 'name' => 'Savings'],
            ['balance' => '10.00']
        );

        $carolResponsibility = Chore::firstOrCreate(
            ['family_id' => $testFamily->id, 'name' => 'Set the table'],
            [
                'emoji' => '🍽️',
                'reward_type' => ChoreRewardType::Responsibility,
                'frequency' => ChoreFrequency::Weekly,
                'requires_approval' => false,
                'is_active' => true,
                'created_by' => $user->id,
            ]
        );
        $carolResponsibility->spenders()->syncWithoutDetaching([$carol->id]);

        // Carol completed her responsibility chore this week
        ChoreCompletion::firstOrCreate(
            ['chore_id' => $carolResponsibility->id, 'spender_id' => $carol->id, 'completed_at' => now()->startOfWeek()->addHours(10)],
            ['status' => CompletionStatus::Approved, 'reviewed_at' => now()->startOfWeek()->addHours(11), 'reviewed_by' => $user->id]
        );

        PocketMoneySchedule::firstOrCreate(
            ['spender_id' => $carol->id],
            [
                'account_id' => $carolAccount->id,
                'amount' => '6.00',
                'frequency' => 'weekly',
                'day_of_week' => now()->dayOfWeek,
                'is_active' => true,
                'next_run_at' => now()->subMinutes(1), // overdue — will pay (responsibilities met)
                'created_by' => $user->id,
            ]
        );

        // ── Billing test families ──────────────────────────────────────────────

        $this->seedBillingFamilies($user);
    }

    /**
     * Create four families to test different billing states.
     * All attached to the same user so you can switch between them.
     */
    private function seedBillingFamilies(User $user): void
    {
        // 1. Trial expiring soon (2 days left)
        $trialExpiring = Family::firstOrCreate(
            ['name' => 'Trial Expiring Soon'],
            ['billing_user_id' => $user->id],
        );
        $trialExpiring->forceFill(['trial_ends_at' => now()->addDays(2), 'billing_user_id' => $user->id])->save();

        FamilyUser::firstOrCreate(
            ['family_id' => $trialExpiring->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );
        $this->seedFamilyKid($trialExpiring, 'Mia', '#ec4899', '8.00');

        // 2. Trial just expired (yesterday)
        $trialExpired = Family::firstOrCreate(
            ['name' => 'Trial Expired'],
            ['billing_user_id' => $user->id],
        );
        $trialExpired->forceFill(['trial_ends_at' => now()->subDay(), 'billing_user_id' => $user->id])->save();

        FamilyUser::firstOrCreate(
            ['family_id' => $trialExpired->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );
        $this->seedFamilyKid($trialExpired, 'Noah', '#3b82f6', '15.00');

        // 3. Active subscription
        $activeSubscription = Family::firstOrCreate(
            ['name' => 'Active Subscriber'],
            ['billing_user_id' => $user->id],
        );
        $activeSubscription->forceFill([
            'trial_ends_at' => now()->subMonth(),
            'billing_user_id' => $user->id,
        ])->save();

        FamilyUser::firstOrCreate(
            ['family_id' => $activeSubscription->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );
        $this->seedFamilyKid($activeSubscription, 'Olivia', '#f59e0b', '22.50');

        // Fake an active subscription record
        DB::table('subscriptions')->insertOrIgnore([
            'family_id' => $activeSubscription->id,
            'type' => 'default',
            'stripe_id' => 'sub_fake_active_'.substr($activeSubscription->id, 0, 8),
            'stripe_status' => 'active',
            'stripe_price' => 'price_fake_monthly',
            'quantity' => 1,
            'trial_ends_at' => null,
            'ends_at' => null,
            'created_at' => now()->subMonth(),
            'updated_at' => now(),
        ]);

        // 4. Lapsed subscription (past_due — billing failed)
        $lapsedSubscription = Family::firstOrCreate(
            ['name' => 'Lapsed Subscriber'],
            ['billing_user_id' => $user->id],
        );
        $lapsedSubscription->forceFill([
            'trial_ends_at' => now()->subMonths(2),
            'billing_user_id' => $user->id,
        ])->save();

        FamilyUser::firstOrCreate(
            ['family_id' => $lapsedSubscription->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );
        $this->seedFamilyKid($lapsedSubscription, 'Liam', '#ef4444', '30.00');

        // Fake a past_due subscription record
        DB::table('subscriptions')->insertOrIgnore([
            'family_id' => $lapsedSubscription->id,
            'type' => 'default',
            'stripe_id' => 'sub_fake_lapsed_'.substr($lapsedSubscription->id, 0, 8),
            'stripe_status' => 'past_due',
            'stripe_price' => 'price_fake_monthly',
            'quantity' => 1,
            'trial_ends_at' => null,
            'ends_at' => null,
            'created_at' => now()->subMonths(2),
            'updated_at' => now()->subWeek(),
        ]);
    }

    private function seedFamilyKid(Family $family, string $name, string $color, string $balance): void
    {
        $spender = Spender::firstOrCreate(
            ['family_id' => $family->id, 'name' => $name],
            ['color' => $color]
        );

        Account::firstOrCreate(
            ['spender_id' => $spender->id, 'name' => 'Savings'],
            ['balance' => $balance]
        );
    }
}
