<?php

use Illuminate\Support\Facades\Http;

describe('feedback submission', function () {
    it('accepts feedback via API', function () {
        Http::fake();

        [$user] = parentWithFamily(['Emma']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/feedback', [
                'type' => 'Bug Report',
                'title' => 'Something broken',
                'description' => 'The button does not work',
                'platform' => 'Android',
                'app_version' => '1.0.0',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Thank you for your feedback!');
    });

    it('accepts feedback via web', function () {
        Http::fake();

        [$user] = parentWithFamily(['Emma']);

        $this->actingAs($user)
            ->post(route('feedback.store'), [
                'type' => 'Feature Request',
                'title' => 'Add dark mode',
                'description' => 'Would love a dark theme option',
            ])
            ->assertRedirect();
    });

    it('validates required fields', function () {
        [$user] = parentWithFamily();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/feedback', [
                'type' => 'Bug Report',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description']);
    });

    it('validates feedback type', function () {
        [$user] = parentWithFamily();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/feedback', [
                'type' => 'Complaint',
                'title' => 'Test',
                'description' => 'Test',
                'platform' => 'Android',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type']);
    });

    it('rejects unauthenticated requests', function () {
        $this->postJson('/api/v1/feedback', [
            'type' => 'Bug Report',
            'title' => 'Test',
            'description' => 'Test',
            'platform' => 'Android',
        ])->assertUnauthorized();
    });

    it('posts to Notion when configured', function () {
        Http::fake(['https://api.notion.com/*' => Http::response(['id' => 'fake-page-id'], 200)]);

        config([
            'services.notion.token' => 'fake-token',
            'services.notion.feedback_database_id' => 'fake-db-id',
        ]);

        [$user] = parentWithFamily(['Emma']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/feedback', [
                'type' => 'General Feedback',
                'title' => 'Love the app',
                'description' => 'Great work!',
                'platform' => 'iOS',
                'app_version' => '1.0.0',
            ])
            ->assertCreated();

        Http::assertSent(fn ($request) => str_contains($request->url(), 'notion.com/v1/pages')
            && str_contains($request->body(), 'Love the app')
        );
    });
});
