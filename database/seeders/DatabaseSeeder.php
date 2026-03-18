<?php

namespace Database\Seeders;

use App\Enums\FamilyRole;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'ben@example.com'],
            [
                'name'               => 'ben',
                'display_name'       => 'Ben',
                'password'           => bcrypt('test1234'),
                'email_verified_at'  => now(),
            ]
        );

        $family = Family::firstOrCreate(['name' => "Ben's Family"]);

        FamilyUser::firstOrCreate(
            ['family_id' => $family->id, 'user_id' => $user->id],
            ['role' => FamilyRole::Admin]
        );
    }
}
