<?php

use App\Models\FamilyLinkCode;
use App\Models\SpenderLinkCode;

describe('code lookup', function () {

    it('identifies a valid spender link code', function () {
        [$user, $family, $spenders] = parentWithFamily(['Alice']);
        $spender = $spenders->first();

        SpenderLinkCode::create([
            'spender_id' => $spender->id,
            'family_id' => $family->id,
            'code' => 'KID123',
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/v1/codes/lookup', ['code' => 'KID123'])
            ->assertOk()
            ->assertJson([
                'data' => [
                    'type' => 'spender',
                    'spender_name' => $spender->name,
                    'family_name' => $family->name,
                ],
            ]);
    });

    it('identifies a valid family link code', function () {
        [$user, $family] = parentWithFamily();

        FamilyLinkCode::create([
            'family_id' => $family->id,
            'code' => 'FAM456',
            'role' => 'member',
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/v1/codes/lookup', ['code' => 'FAM456'])
            ->assertOk()
            ->assertJson([
                'data' => [
                    'type' => 'family',
                    'family_name' => $family->name,
                ],
            ]);
    });

    it('returns 422 for an unknown code', function () {
        $this->postJson('/api/v1/codes/lookup', ['code' => 'XXXXXX'])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid or expired code.']);
    });

    it('returns 422 for an expired spender code', function () {
        [$user, $family, $spenders] = parentWithFamily(['Bob']);
        $spender = $spenders->first();

        SpenderLinkCode::factory()->expired()->create([
            'spender_id' => $spender->id,
            'family_id' => $family->id,
            'code' => 'EXP123',
            'created_by' => $user->id,
        ]);

        $this->postJson('/api/v1/codes/lookup', ['code' => 'EXP123'])
            ->assertStatus(422);
    });

    it('returns 422 for an already-used family code', function () {
        [$user, $family] = parentWithFamily();

        FamilyLinkCode::create([
            'family_id' => $family->id,
            'code' => 'USED99',
            'role' => 'member',
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
            'used_at' => now(),
        ]);

        $this->postJson('/api/v1/codes/lookup', ['code' => 'USED99'])
            ->assertStatus(422);
    });

    it('is case-insensitive', function () {
        [$user, $family] = parentWithFamily();

        FamilyLinkCode::create([
            'family_id' => $family->id,
            'code' => 'UPPER1',
            'role' => 'member',
            'created_by' => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/v1/codes/lookup', ['code' => 'upper1'])
            ->assertOk()
            ->assertJsonPath('data.type', 'family');
    });

    it('validates that code must be 6 characters', function () {
        $this->postJson('/api/v1/codes/lookup', ['code' => 'AB'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    });

});
