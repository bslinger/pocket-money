<?php

namespace Database\Factories;

use App\Enums\ChoreFrequency;
use App\Enums\ChoreRewardType;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChoreFactory extends Factory
{
    public function definition(): array
    {
        return [
            'family_id'        => Family::factory(),
            'name'             => fake()->words(3, true),
            'reward_type'      => ChoreRewardType::Earns,
            'amount'           => '1.00',
            'frequency'        => ChoreFrequency::Weekly,
            'days_of_week'     => [0],
            'requires_approval' => true,
            'up_for_grabs'     => false,
            'is_active'        => true,
            'created_by'       => User::factory(),
        ];
    }

    public function earns(float $amount = 1.00): static
    {
        return $this->state(['reward_type' => ChoreRewardType::Earns, 'amount' => $amount]);
    }

    public function responsibility(): static
    {
        return $this->state(['reward_type' => ChoreRewardType::Responsibility, 'amount' => null]);
    }

    public function noReward(): static
    {
        return $this->state(['reward_type' => ChoreRewardType::NoReward, 'amount' => null]);
    }

    public function upForGrabs(): static
    {
        return $this->state(['up_for_grabs' => true]);
    }

    public function noApproval(): static
    {
        return $this->state(['requires_approval' => false]);
    }
}
