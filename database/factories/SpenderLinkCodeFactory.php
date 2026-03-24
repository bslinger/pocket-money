<?php

namespace Database\Factories;

use App\Models\Family;
use App\Models\Spender;
use App\Models\SpenderLinkCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<SpenderLinkCode> */
class SpenderLinkCodeFactory extends Factory
{
    protected $model = SpenderLinkCode::class;

    public function definition(): array
    {
        return [
            'spender_id' => Spender::factory(),
            'family_id' => Family::factory(),
            'code' => strtoupper(Str::random(6)),
            'created_by' => User::factory(),
            'expires_at' => now()->addMinutes(10),
        ];
    }

    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subMinute()]);
    }

    public function used(): static
    {
        return $this->state(['used_at' => now()]);
    }
}
