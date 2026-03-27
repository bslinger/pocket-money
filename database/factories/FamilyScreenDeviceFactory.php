<?php

namespace Database\Factories;

use App\Models\Family;
use App\Models\FamilyScreenDevice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FamilyScreenDevice>
 */
class FamilyScreenDeviceFactory extends Factory
{
    protected $model = FamilyScreenDevice::class;

    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'device_name' => fake()->randomElement(['Kitchen Tablet', 'Family iPad', 'Living Room Screen']),
            'token' => hash('sha256', Str::random(40)),
        ];
    }

    public function revoked(): static
    {
        return $this->state(['revoked_at' => now()]);
    }
}
