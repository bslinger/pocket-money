<?php

namespace Database\Factories;

use App\Models\Family;
use Illuminate\Database\Eloquent\Factories\Factory;

class SpenderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'name'      => fake()->firstName(),
            'color'     => fake()->hexColor(),
        ];
    }
}
