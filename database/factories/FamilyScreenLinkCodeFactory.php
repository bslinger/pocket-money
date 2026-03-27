<?php

namespace Database\Factories;

use App\Models\Family;
use App\Models\FamilyScreenLinkCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FamilyScreenLinkCode>
 */
class FamilyScreenLinkCodeFactory extends Factory
{
    protected $model = FamilyScreenLinkCode::class;

    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'created_by' => User::factory(),
            'code' => strtoupper(fake()->lexify('??????')),
            'expires_at' => now()->addMinutes(10),
        ];
    }
}
