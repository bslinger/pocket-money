<?php

namespace Database\Factories;

use App\Models\Spender;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'spender_id'    => Spender::factory(),
            'name'          => fake()->randomElement(['Spending', 'Savings', 'Pocket Money']),
            'balance'       => 0,
        ];
    }

    public function withBalance(float $amount): static
    {
        return $this->state(['balance' => $amount]);
    }
}
