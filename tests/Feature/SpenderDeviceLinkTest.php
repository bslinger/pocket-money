<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Models\Spender;
use App\Models\SpenderDevice;
use App\Models\SpenderLinkCode;

describe('spender device linking', function () {

    describe('generate link code (parent)', function () {
        it('creates a link code for a spender', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/spenders/{$spender->id}/link-code")
                ->assertCreated()
                ->assertJsonStructure(['data' => ['id', 'code', 'spender_name', 'expires_at']])
                ->assertJsonPath('data.spender_name', 'Emma');

            expect(SpenderLinkCode::where('spender_id', $spender->id)->count())->toBe(1);
        });

        it('generates a 6-character uppercase code', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $response = $this->actingAs($user, 'sanctum')
                ->postJson("/api/v1/spenders/{$spender->id}/link-code")
                ->assertCreated();

            $code = $response->json('data.code');
            expect($code)->toHaveLength(6);
            expect($code)->toEqual(strtoupper($code));
        });

        it('rejects unauthenticated requests', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->postJson("/api/v1/spenders/{$spender->id}/link-code")
                ->assertUnauthorized();
        });

        it('rejects users who are not in the family', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            [$otherUser] = parentWithFamily();

            $this->actingAs($otherUser, 'sanctum')
                ->postJson("/api/v1/spenders/{$spender->id}/link-code")
                ->assertForbidden();
        });
    });

    describe('claim link code (child device)', function () {
        it('claims a valid code and receives a device token', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $linkCode = SpenderLinkCode::create([
                'spender_id' => $spender->id,
                'family_id' => $family->id,
                'code' => 'ABC123',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $response = $this->postJson('/api/v1/spender-devices/claim', [
                'code' => 'ABC123',
                'device_name' => 'Kid iPad',
            ]);

            $response->assertOk()
                ->assertJsonStructure(['data' => ['token', 'device_id', 'spender' => ['id', 'name', 'color', 'family_name']]])
                ->assertJsonPath('data.spender.name', 'Emma');

            expect($response->json('data.token'))->not->toBeEmpty();
            expect(SpenderDevice::where('spender_id', $spender->id)->count())->toBe(1);

            $linkCode->refresh();
            expect($linkCode->used_at)->not->toBeNull();
        });

        it('is case insensitive', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            SpenderLinkCode::create([
                'spender_id' => $spender->id,
                'family_id' => $family->id,
                'code' => 'XYZ789',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->postJson('/api/v1/spender-devices/claim', ['code' => 'xyz789'])
                ->assertOk();
        });

        it('rejects an expired code', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            SpenderLinkCode::create([
                'spender_id' => $spender->id,
                'family_id' => $family->id,
                'code' => 'EXPIRD',
                'created_by' => $user->id,
                'expires_at' => now()->subMinute(),
            ]);

            $this->postJson('/api/v1/spender-devices/claim', ['code' => 'EXPIRD'])
                ->assertUnprocessable()
                ->assertJsonPath('message', 'Invalid or expired link code.');
        });

        it('rejects an already used code', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            SpenderLinkCode::create([
                'spender_id' => $spender->id,
                'family_id' => $family->id,
                'code' => 'USED01',
                'created_by' => $user->id,
                'expires_at' => now()->addMinutes(10),
                'used_at' => now(),
            ]);

            $this->postJson('/api/v1/spender-devices/claim', ['code' => 'USED01'])
                ->assertUnprocessable();
        });

        it('rejects an invalid code', function () {
            $this->postJson('/api/v1/spender-devices/claim', ['code' => 'NOPE00'])
                ->assertUnprocessable();
        });
    });

    describe('child device authentication', function () {
        it('accesses child dashboard with device token', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            Account::factory()->create(['spender_id' => $spender->id, 'balance' => '25.00']);

            $device = SpenderDevice::createForSpender($spender, 'Test Device');

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->getJson('/api/v1/child/dashboard')
                ->assertOk()
                ->assertJsonPath('data.spender.name', 'Emma')
                ->assertJsonPath('data.balance', '25.00');
        });

        it('rejects requests with no token', function () {
            $this->getJson('/api/v1/child/dashboard')
                ->assertUnauthorized();
        });

        it('rejects requests with invalid token', function () {
            $this->withHeaders(['Authorization' => 'Bearer invalid-token-here'])
                ->getJson('/api/v1/child/dashboard')
                ->assertUnauthorized();
        });

        it('rejects requests with revoked device token', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $device = SpenderDevice::createForSpender($spender, 'Old Device');
            $plainToken = $device->plainToken;
            $device->revoke();

            $this->withHeaders(['Authorization' => "Bearer {$plainToken}"])
                ->getJson('/api/v1/child/dashboard')
                ->assertUnauthorized();
        });
    });

    describe('child complete chore', function () {
        it('marks a chore as completed', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $chore = Chore::factory()->create([
                'family_id' => $family->id,
                'requires_approval' => false,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
            $chore->spenders()->attach($spender->id);

            $device = SpenderDevice::createForSpender($spender);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/child/chores/{$chore->id}/complete")
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

            $device = SpenderDevice::createForSpender($spender);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/child/chores/{$chore->id}/complete")
                ->assertCreated()
                ->assertJsonPath('data.status', 'pending');
        });

        it('rejects completion for unassigned chore', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $chore = Chore::factory()->create([
                'family_id' => $family->id,
                'is_active' => true,
                'created_by' => $user->id,
            ]);
            // Not attached to this spender

            $device = SpenderDevice::createForSpender($spender);

            $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
                ->postJson("/api/v1/child/chores/{$chore->id}/complete")
                ->assertNotFound();
        });
    });

    describe('manage devices (parent)', function () {
        it('lists active devices for a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            SpenderDevice::factory()->create(['spender_id' => $spender->id, 'device_name' => 'iPad']);
            SpenderDevice::factory()->create(['spender_id' => $spender->id, 'device_name' => 'Phone']);
            SpenderDevice::factory()->revoked()->create(['spender_id' => $spender->id, 'device_name' => 'Old']);

            $response = $this->actingAs($user, 'sanctum')
                ->getJson("/api/v1/spenders/{$spender->id}/devices")
                ->assertOk();

            expect($response->json('data'))->toHaveCount(2);
        });

        it('revokes a device', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $device = SpenderDevice::factory()->create(['spender_id' => $spender->id]);

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/v1/spender-devices/{$device->id}")
                ->assertOk();

            $device->refresh();
            expect($device->revoked_at)->not->toBeNull();
        });

        it('prevents revoking devices from another family', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            [$otherUser] = parentWithFamily();

            $device = SpenderDevice::factory()->create(['spender_id' => $spender->id]);

            $this->actingAs($otherUser, 'sanctum')
                ->deleteJson("/api/v1/spender-devices/{$device->id}")
                ->assertForbidden();
        });
    });
});
