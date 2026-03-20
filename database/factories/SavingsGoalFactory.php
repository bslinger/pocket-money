<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Spender;
use Illuminate\Database\Eloquent\Factories\Factory;

class SavingsGoalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'spender_id'    => Spender::factory(),
            'account_id'    => Account::factory(),
            'name'          => fake()->words(2, true),
            'target_amount' => fake()->randomFloat(2, 10, 500),
            'is_completed'  => false,
        ];
    }

    public function completed(): static
    {
        return $this->state(['is_completed' => true]);
    }
}
