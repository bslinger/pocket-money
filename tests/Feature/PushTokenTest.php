<?php

use App\Models\PushToken;
use App\Models\Spender;
use App\Models\SpenderDevice;

describe('push token registration (parent)', function () {
    it('registers a device token', function () {
        [$user] = parentWithFamily();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/device-tokens', ['token' => 'fcm-token-123', 'platform' => 'android'])
            ->assertCreated();

        expect(PushToken::where('token', 'fcm-token-123')->exists())->toBeTrue();
        expect(PushToken::first()->tokenable_id)->toBe($user->id);
        expect(PushToken::first()->platform)->toBe('android');
    });

    it('replaces existing token on re-registration', function () {
        [$user] = parentWithFamily();
        PushToken::register($user, 'old-token', 'android');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/device-tokens', ['token' => 'old-token', 'platform' => 'ios'])
            ->assertCreated();

        expect(PushToken::where('token', 'old-token')->count())->toBe(1);
        expect(PushToken::where('token', 'old-token')->first()->platform)->toBe('ios');
    });

    it('unregisters a device token', function () {
        [$user] = parentWithFamily();
        PushToken::register($user, 'remove-me', 'android');

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/device-tokens', ['token' => 'remove-me'])
            ->assertOk();

        expect(PushToken::where('token', 'remove-me')->exists())->toBeFalse();
    });

    it('rejects unauthenticated requests', function () {
        $this->postJson('/api/v1/device-tokens', ['token' => 'x', 'platform' => 'ios'])
            ->assertUnauthorized();
    });

    it('validates platform', function () {
        [$user] = parentWithFamily();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/device-tokens', ['token' => 'x', 'platform' => 'windows'])
            ->assertUnprocessable();
    });
});

describe('push token registration (child device)', function () {
    it('registers a push token for a spender', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $device = SpenderDevice::createForSpender($spender, 'iPad');

        $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
            ->postJson('/api/v1/child/device-tokens', ['token' => 'apns-child-token', 'platform' => 'ios'])
            ->assertCreated();

        expect(PushToken::where('token', 'apns-child-token')->exists())->toBeTrue();
        $pushToken = PushToken::where('token', 'apns-child-token')->first();
        expect($pushToken->tokenable_type)->toBe(Spender::class);
        expect($pushToken->tokenable_id)->toBe($spender->id);
    });

    it('unregisters a push token for a spender', function () {
        [$user, , $spenders] = parentWithFamily(['Emma']);
        $spender = $spenders->first();
        $device = SpenderDevice::createForSpender($spender, 'iPad');
        PushToken::register($spender, 'child-remove', 'ios');

        $this->withHeaders(['Authorization' => "Bearer {$device->plainToken}"])
            ->deleteJson('/api/v1/child/device-tokens', ['token' => 'child-remove'])
            ->assertOk();

        expect(PushToken::where('token', 'child-remove')->exists())->toBeFalse();
    });
});
