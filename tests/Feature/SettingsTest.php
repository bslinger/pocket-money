<?php

use App\Models\SocialAccount;
use App\Models\User;

describe('settings', function () {

    it('shows the settings page', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('settings'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Settings/Index'));
    });

    it('passes social accounts to the settings page', function () {
        $user = User::factory()->create();
        SocialAccount::factory()->for($user)->create(['provider' => 'google', 'name' => 'Jane Doe', 'email' => 'jane@gmail.com']);

        $this->actingAs($user)
            ->get(route('settings'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Settings/Index')
                ->has('socialAccounts.google')
            );
    });

    it('updates display name and email', function () {
        $user = User::factory()->create(['display_name' => 'Old Name']);

        $this->actingAs($user)
            ->put(route('settings.profile.update'), [
                'display_name' => 'New Name',
                'email' => $user->email,
            ])
            ->assertRedirect(route('settings'));

        expect($user->fresh()->display_name)->toBe('New Name');
    });

    it('saves avatar_key when provided', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.profile.update'), [
                'email' => $user->email,
                'avatar_key' => 'uploads/abc123/avatar.jpg',
            ])
            ->assertRedirect(route('settings'));

        expect($user->fresh()->avatar_key)->toBe('uploads/abc123/avatar.jpg');
    });

    it('validates email uniqueness', function () {
        $existing = User::factory()->create();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.profile.update'), [
                'email' => $existing->email,
            ])
            ->assertSessionHasErrors('email');
    });

    it('allows the user to keep their own email', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put(route('settings.profile.update'), [
                'display_name' => 'Updated',
                'email' => $user->email,
            ])
            ->assertSessionHasNoErrors();
    });

    it('exports data as JSON', function () {
        [$user] = parentWithFamily(['Emma']);

        $this->actingAs($user)
            ->get(route('settings.export'))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('deletes the account when correct password is provided', function () {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);
        $id = $user->id;

        $this->actingAs($user)
            ->delete(route('settings.account.destroy'), ['password' => 'secret123'])
            ->assertRedirect('/');

        expect(User::find($id))->toBeNull();
    });

    it('rejects account deletion with wrong password', function () {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);

        $this->actingAs($user)
            ->delete(route('settings.account.destroy'), ['password' => 'wrongpassword'])
            ->assertSessionHasErrors('password');
    });
});
