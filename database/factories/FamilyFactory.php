<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FamilyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->lastName() . ' Family',
        ];
    }
}
