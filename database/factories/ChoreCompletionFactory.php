<?php

namespace Database\Factories;

use App\Enums\CompletionStatus;
use App\Models\Chore;
use App\Models\Spender;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChoreCompletionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'chore_id'     => Chore::factory(),
            'spender_id'   => Spender::factory(),
            'status'       => CompletionStatus::Pending,
            'completed_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state(['status' => CompletionStatus::Approved]);
    }

    public function declined(): static
    {
        return $this->state(['status' => CompletionStatus::Declined]);
    }
}
