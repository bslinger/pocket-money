<?php

namespace Database\Factories;

use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PocketMoneyScheduleFactory extends Factory
{
    protected $model = PocketMoneySchedule::class;

    public function definition(): array
    {
        return [
            'spender_id'   => Spender::factory(),
            'amount'       => '5.00',
            'frequency'    => 'weekly',
            'day_of_week'  => 0, // Monday
            'day_of_month' => null,
            'is_active'    => true,
            'next_run_at'  => now()->addDays(7),
            'created_by'   => User::factory(),
        ];
    }

    public function weekly(float $amount = 5.00, int $dayOfWeek = 0): static
    {
        return $this->state([
            'frequency'   => 'weekly',
            'amount'      => number_format($amount, 2),
            'day_of_week' => $dayOfWeek,
        ]);
    }

    public function monthly(float $amount = 20.00, int $dayOfMonth = 1): static
    {
        return $this->state([
            'frequency'    => 'monthly',
            'amount'       => number_format($amount, 2),
            'day_of_week'  => null,
            'day_of_month' => $dayOfMonth,
        ]);
    }

    public function due(): static
    {
        return $this->state(['next_run_at' => now()->subMinute()]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
