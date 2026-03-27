<?php

use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\FamilyScreenDevice;
use App\Models\FamilyScreenLinkCode;
use App\Models\Spender;
use App\Models\User;

describe('family screen link codes', function () {

    describe('generate (parent)', function () {
        it('creates a link code for a family member', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/families/{$family->id}/family-screen-link-code")
                ->assertCreated()
                ->assertJsonStructure(['data' => ['id', 'code', 'family_name', 'expires_at']])
                ->assertJsonPath('data.family_name', $family->name);

            expect(FamilyScreenLinkCode::where('family_id', $family->id)->count())->toBe(1);
        });

        it('generates a 6-character uppercase code', function () {
            [$user, $family] = parentWithFamily();

            $response = $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/families/{$family->id}/family-screen-link-code")
                ->assertCreated();

            $code = $response->json('data.code');
            expect($code)->toHaveLength(6);
            expect($code)->toEqual(strtoupper($code));
        });

        it('rejects non-family members', function () {
            [, $family] = parentWithFamily();
            $outsider = User::factory()->create();

            $this->actingAs($outsider, 'sanctum')
                ->postJson("/api/v1/families/{$family->id}/family-screen-link-code")
                ->assertForbidden();
        });

        it('rejects unauthenticated requests', function () {
            [, $family] = parentWithFamily();

            $this->postJson("/api/v1/families/{$family->id}/family-screen-link-code")
                ->assertUnauthorized();
        });
    });

    describe('code lookup', function () {
        it('returns family_screen type for valid family screen code', function () {
            [$user, $family] = parentWithFamily();

            FamilyScreenLinkCode::create([
                'family_id' => $family->id,
                'code' => 'SCR123',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->postJson('/api/v1/codes/lookup', ['code' => 'SCR123'])
                ->assertOk()
                ->assertJsonPath('data.type', 'family_screen')
                ->assertJsonPath('data.family_name', $family->name);
        });
    });

    describe('claim (tablet device)', function () {
        it('claims a valid code and receives a device token', function () {
            [$user, $family] = parentWithFamily();

            $linkCode = FamilyScreenLinkCode::create([
                'family_id' => $family->id,
                'code' => 'SCR456',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $response = $this->postJson('/api/v1/family-screen-devices/claim', [
                'code' => 'SCR456',
                'device_name' => 'Kitchen Tablet',
            ]);

            $response->assertOk()
                ->assertJsonStructure(['data' => ['token', 'device_id', 'family' => ['id', 'name', 'currency_symbol']]])
                ->assertJsonPath('data.family.name', $family->name);

            expect($response->json('data.token'))->not->toBeEmpty();
            expect(FamilyScreenDevice::where('family_id', $family->id)->count())->toBe(1);

            $linkCode->refresh();
            expect($linkCode->used_at)->not->toBeNull();
        });

        it('is case insensitive', function () {
            [$user, $family] = parentWithFamily();

            FamilyScreenLinkCode::create([
                'family_id' => $family->id,
                'code' => 'SCRXYZ',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->postJson('/api/v1/family-screen-devices/claim', ['code' => 'scrxyz'])
                ->assertOk();
        });

        it('rejects expired codes', function () {
            [$user, $family] = parentWithFamily();

            FamilyScreenLinkCode::create([
                'family_id' => $family->id,
                'code' => 'EXPSCR',
                'created_by' => $user->id,
                'expires_at' => now()->subMinute(),
            ]);

            $this->postJson('/api/v1/family-screen-devices/claim', ['code' => 'EXPSCR'])
                ->assertUnprocessable();
        });

        it('rejects already-used codes', function () {
            [$user, $family] = parentWithFamily();

            FamilyScreenLinkCode::create([
                'family_id' => $family->id,
                'code' => 'USEDSC',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
                'used_at' => now(),
            ]);

            $this->postJson('/api/v1/family-screen-devices/claim', ['code' => 'USEDSC'])
                ->assertUnprocessable();
        });
    });

    describe('family screen dashboard', function () {
        it('returns family and all spenders with balances and chores', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);
            $device = FamilyScreenDevice::createForFamily($family, 'Test Screen');

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->getJson('/api/v1/family-screen/dashboard')
                ->assertOk()
                ->assertJsonStructure([
                    'data' => [
                        'family' => ['id', 'name', 'currency_symbol'],
                        'spenders' => [
                            '*' => ['id', 'name', 'color', 'balance', 'goals', 'chores', 'completions_today'],
                        ],
                    ],
                ])
                ->assertJsonCount(2, 'data.spenders');
        });

        it('rejects unauthenticated requests', function () {
            $this->getJson('/api/v1/family-screen/dashboard')
                ->assertUnauthorized();
        });

        it('rejects requests with invalid token', function () {
            $this->withHeaders(['Authorization' => 'Bearer bad-token'])
                ->getJson('/api/v1/family-screen/dashboard')
                ->assertUnauthorized();
        });

        it('rejects revoked device tokens', function () {
            [$user, $family] = parentWithFamily();
            $device = FamilyScreenDevice::createForFamily($family);
            $plainToken = $device->plainToken;
            $device->revoke();

            $this->withHeaders(['Authorization' => "Bearer {$plainToken}"])
                ->getJson('/api/v1/family-screen/dashboard')
                ->assertUnauthorized();
        });
    });

    describe('complete chore via family screen', function () {
        it('marks a chore as completed for a spender', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $chore = Chore::factory()->create([
                'family_id' => $family->id,
                'requires_approval' => false,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
            $chore->spenders()->attach($spender->id);

            $device = FamilyScreenDevice::createForFamily($family);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/family-screen/spenders/{$spender->id}/chores/{$chore->id}/complete")
                ->assertCreated()
                ->assertJsonPath('data.status', 'approved');

            expect(ChoreCompletion::where('spender_id', $spender->id)->where('chore_id', $chore->id)->count())->toBe(1);
        });

        it('creates pending completion when approval required', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $chore = Chore::factory()->create([
                'family_id' => $family->id,
                'requires_approval' => true,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
            $chore->spenders()->attach($spender->id);

            $device = FamilyScreenDevice::createForFamily($family);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/family-screen/spenders/{$spender->id}/chores/{$chore->id}/complete")
                ->assertCreated()
                ->assertJsonPath('data.status', 'pending');
        });

        it('rejects chore from a different family', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            [$otherUser, $otherFamily, $otherSpenders] = parentWithFamily(['Max']);
            $otherSpender = $otherSpenders->first();

            $chore = Chore::factory()->create([
                'family_id' => $family->id,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
            $chore->spenders()->attach($spender->id);

            $device = FamilyScreenDevice::createForFamily($otherFamily);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/family-screen/spenders/{$spender->id}/chores/{$chore->id}/complete")
                ->assertNotFound();
        });

        it('rejects chore not assigned to the spender', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $chore = Chore::factory()->create([
                'family_id' => $family->id,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
            // Not attached to spender

            $device = FamilyScreenDevice::createForFamily($family);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/family-screen/spenders/{$spender->id}/chores/{$chore->id}/complete")
                ->assertNotFound();
        });
    });

    describe('manage devices (parent)', function () {
        it('lists active family screen devices', function () {
            [$user, $family] = parentWithFamily();

            FamilyScreenDevice::factory()->create(['family_id' => $family->id, 'device_name' => 'Kitchen Tablet']);
            FamilyScreenDevice::factory()->create(['family_id' => $family->id, 'device_name' => 'Lounge Screen']);
            FamilyScreenDevice::factory()->revoked()->create(['family_id' => $family->id, 'device_name' => 'Old Device']);

            $response = $this->actingAs($user, 'sanctum')
                ->getJson("/api/v1/families/{$family->id}/family-screen-devices")
                ->assertOk();

            expect($response->json('data'))->toHaveCount(2);
        });

        it('revokes a family screen device', function () {
            [$user, $family] = parentWithFamily();

            $device = FamilyScreenDevice::factory()->create(['family_id' => $family->id]);

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/family-screen-devices/{$device->id}")
                ->assertOk();

            $device->refresh();
            expect($device->revoked_at)->not->toBeNull();
        });

        it('prevents revoking devices from another family', function () {
            [, $family] = parentWithFamily();
            [$otherUser] = parentWithFamily();

            $device = FamilyScreenDevice::factory()->create(['family_id' => $family->id]);

            $this->actingAs($otherUser, 'sanctum')
                ->deleteJson("/api/v1/family-screen-devices/{$device->id}")
                ->assertForbidden();
        });
    });
});
