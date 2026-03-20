<?php

namespace Database\Factories;

use App\Enums\Frequency;
use App\Enums\TxType;
use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecurringTransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id'  => Account::factory(),
            'type'        => TxType::Credit,
            'amount'      => '5.00',
            'description' => 'Weekly pocket money',
            'frequency'   => Frequency::Weekly,
            'next_run_at' => now()->addWeek(),
            'is_active'   => true,
        ];
    }

    public function weekly(float $amount = 5.00): static
    {
        return $this->state(['frequency' => Frequency::Weekly, 'amount' => $amount]);
    }

    public function monthly(): static
    {
        return $this->state(['frequency' => Frequency::Monthly]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
