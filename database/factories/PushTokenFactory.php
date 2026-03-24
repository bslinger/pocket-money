<?php

namespace Database\Factories;

use App\Models\PushToken;
use App\Models\Spender;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PushToken> */
class PushTokenFactory extends Factory
{
    protected $model = PushToken::class;

    public function definition(): array
    {
        return [
            'tokenable_type' => User::class,
            'tokenable_id' => User::factory(),
            'token' => Str::random(152),
            'platform' => fake()->randomElement(['ios', 'android']),
        ];
    }

    public function forSpender(): static
    {
        return $this->state([
            'tokenable_type' => Spender::class,
            'tokenable_id' => Spender::factory(),
        ]);
    }

    public function ios(): static
    {
        return $this->state(['platform' => 'ios']);
    }

    public function android(): static
    {
        return $this->state(['platform' => 'android']);
    }
}
