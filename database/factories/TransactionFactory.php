<?php

namespace Database\Factories;

use App\Enums\TxType;
use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id'  => Account::factory(),
            'type'        => TxType::Credit,
            'amount'      => fake()->randomFloat(2, 1, 100),
            'description' => fake()->sentence(3),
            'occurred_at' => now(),
            'created_by'  => User::factory(),
        ];
    }

    public function credit(): static
    {
        return $this->state(['type' => TxType::Credit]);
    }

    public function debit(): static
    {
        return $this->state(['type' => TxType::Debit]);
    }
}
