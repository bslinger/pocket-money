<?php

namespace Database\Factories;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SocialAccount>
 */
class SocialAccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => $this->faker->randomElement(['google', 'apple', 'facebook']),
            'provider_id' => $this->faker->uuid(),
            'email' => $this->faker->safeEmail(),
            'name' => $this->faker->name(),
            'avatar_url' => null,
            'token' => null,
            'refresh_token' => null,
            'token_expires_at' => null,
        ];
    }
}
