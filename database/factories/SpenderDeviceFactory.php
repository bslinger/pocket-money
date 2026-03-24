<?php

namespace Database\Factories;

use App\Models\Spender;
use App\Models\SpenderDevice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<SpenderDevice> */
class SpenderDeviceFactory extends Factory
{
    protected $model = SpenderDevice::class;

    public function definition(): array
    {
        return [
            'spender_id' => Spender::factory(),
            'device_name' => fake()->randomElement(['iPhone', 'iPad', 'Android Phone', 'Android Tablet']),
            'token' => hash('sha256', Str::random(40)),
        ];
    }

    public function revoked(): static
    {
        return $this->state(['revoked_at' => now()]);
    }
}
