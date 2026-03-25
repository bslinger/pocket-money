<?php

use App\Models\FamilyLinkCode;
use App\Models\FamilyUser;
use App\Models\User;

describe('family link codes', function () {

    describe('generate', function () {
        it('creates a link code for a family member', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->postJson("/api/v1/families/{$family->id}/link-code")
                ->assertCreated()
                ->assertJsonStructure(['data' => ['code', 'expires_at', 'family_name']]);

            expect(FamilyLinkCode::where('family_id', $family->id)->count())->toBe(1);
        });

        it('rejects non-family members', function () {
            [, $family] = parentWithFamily();
            $outsider = User::factory()->create();

            $this->actingAs($outsider)
                ->postJson("/api/v1/families/{$family->id}/link-code")
                ->assertForbidden();
        });
    });

    describe('claim', function () {
        it('registers a new user and joins the family', function () {
            [$user, $family] = parentWithFamily();

            $code = FamilyLinkCode::create([
                'family_id' => $family->id,
                'code' => 'ABC123',
                'role' => 'member',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $response = $this->postJson('/api/v1/family-link-codes/claim', [
                'code' => 'ABC123',
                'name' => 'New Parent',
                'email' => 'newparent@example.com',
                'password' => 'Password123!',
            ])->assertOk();

            $response->assertJsonStructure(['data' => ['token', 'user', 'family']]);

            $newUser = User::where('email', 'newparent@example.com')->first();
            expect($newUser)->not->toBeNull();
            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $newUser->id)->exists())->toBeTrue();

            // Code should be marked as used
            expect($code->fresh()->used_at)->not->toBeNull();
        });

        it('allows an existing user to join with correct password', function () {
            [$user, $family] = parentWithFamily();
            $existingUser = User::factory()->create(['password' => bcrypt('MyPassword1!')]);

            $code = FamilyLinkCode::create([
                'family_id' => $family->id,
                'code' => 'DEF456',
                'role' => 'member',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->postJson('/api/v1/family-link-codes/claim', [
                'code' => 'DEF456',
                'name' => $existingUser->name,
                'email' => $existingUser->email,
                'password' => 'MyPassword1!',
            ])->assertOk();

            expect(FamilyUser::where('family_id', $family->id)->where('user_id', $existingUser->id)->exists())->toBeTrue();
        });

        it('rejects existing user with wrong password', function () {
            [$user, $family] = parentWithFamily();
            $existingUser = User::factory()->create(['password' => bcrypt('CorrectPassword1!')]);

            FamilyLinkCode::create([
                'family_id' => $family->id,
                'code' => 'GHI789',
                'role' => 'member',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->postJson('/api/v1/family-link-codes/claim', [
                'code' => 'GHI789',
                'name' => $existingUser->name,
                'email' => $existingUser->email,
                'password' => 'WrongPassword1!',
            ])->assertStatus(422);
        });

        it('rejects expired codes', function () {
            [$user, $family] = parentWithFamily();

            FamilyLinkCode::create([
                'family_id' => $family->id,
                'code' => 'EXP001',
                'role' => 'member',
                'created_by' => $user->id,
                'expires_at' => now()->subMinute(),
            ]);

            $this->postJson('/api/v1/family-link-codes/claim', [
                'code' => 'EXP001',
                'name' => 'Late Parent',
                'email' => 'late@example.com',
                'password' => 'Password123!',
            ])->assertStatus(422);
        });

        it('rejects already-used codes', function () {
            [$user, $family] = parentWithFamily();

            FamilyLinkCode::create([
                'family_id' => $family->id,
                'code' => 'USED01',
                'role' => 'member',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
                'used_at' => now(),
            ]);

            $this->postJson('/api/v1/family-link-codes/claim', [
                'code' => 'USED01',
                'name' => 'Another Parent',
                'email' => 'another@example.com',
                'password' => 'Password123!',
            ])->assertStatus(422);
        });
    });
});
