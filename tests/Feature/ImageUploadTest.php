<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

describe('image upload', function () {
    it('uploads an image and returns a storage key', function () {
        Storage::fake('images');

        [$user] = parentWithFamily();

        $response = $this->actingAs($user)
            ->postJson(route('uploads.store'), [
                'file' => UploadedFile::fake()->image('avatar.jpg'),
            ]);

        $response->assertOk()
            ->assertJsonStructure(['key', 'url']);

        Storage::disk('images')->assertExists($response->json('key'));
    });

    it('rejects non-image files', function () {
        Storage::fake('images');

        [$user] = parentWithFamily();

        $this->actingAs($user)
            ->postJson(route('uploads.store'), [
                'file' => UploadedFile::fake()->create('document.pdf', 100),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    });

    it('rejects files over 5MB', function () {
        Storage::fake('images');

        [$user] = parentWithFamily();

        $this->actingAs($user)
            ->postJson(route('uploads.store'), [
                'file' => UploadedFile::fake()->image('large.jpg')->size(6000),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    });

    it('requires authentication', function () {
        $this->postJson(route('uploads.store'), [
            'file' => UploadedFile::fake()->image('avatar.jpg'),
        ])->assertUnauthorized();
    });
});
