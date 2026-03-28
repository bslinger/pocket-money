<?php

use App\Models\SocialAccount;
use App\Models\User;

describe('API auth', function () {

    it('returns social accounts keyed by provider', function () {
        $user = User::factory()->create();
        SocialAccount::factory()->for($user)->create([
            'provider' => 'google',
            'name' => 'Jane Doe',
            'email' => 'jane@gmail.com',
        ]);
        SocialAccount::factory()->for($user)->create([
            'provider' => 'facebook',
            'name' => 'Jane Doe',
            'email' => null,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/social-accounts')
            ->assertOk()
            ->assertJsonPath('data.google.provider', 'google')
            ->assertJsonPath('data.google.name', 'Jane Doe')
            ->assertJsonPath('data.facebook.provider', 'facebook');
    });

    it('returns empty data when no social accounts linked', function () {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/social-accounts')
            ->assertOk()
            ->assertJson(['data' => []]);
    });

    it('saves avatar_key on profile update', function () {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/user', [
                'name' => $user->name,
                'avatar_key' => 'uploads/abc/avatar.jpg',
            ])
            ->assertOk();

        expect($user->fresh()->avatar_key)->toBe('uploads/abc/avatar.jpg');
    });

});
