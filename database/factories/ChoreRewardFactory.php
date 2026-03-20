<?php

namespace Database\Factories;

use App\Models\ChoreReward;
use App\Models\Spender;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChoreRewardFactory extends Factory
{
    protected $model = ChoreReward::class;

    public function definition(): array
    {
        return [
            'spender_id'  => Spender::factory(),
            'amount'      => '10.00',
            'description' => fake()->words(3, true),
            'payout_date' => null,
            'is_paid'     => false,
            'paid_at'     => null,
            'transaction_id' => null,
            'created_by'  => User::factory(),
        ];
    }
}
