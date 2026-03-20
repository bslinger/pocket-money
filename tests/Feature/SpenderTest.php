<?php

use App\Models\Spender;
use App\Models\User;

describe('spenders', function () {

    describe('create / store', function () {
        it('shows the create form to a parent', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('spenders.create'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Spenders/Create'));
        });

        it('requires parent role', function () {
            $guest = User::factory()->create();

            $this->actingAs($guest)
                ->get(route('spenders.create'))
                ->assertForbidden();
        });

        it('creates a spender', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->post(route('spenders.store'), [
                    'family_id' => $family->id,
                    'name'      => 'Emma',
                    'color'     => '#6366f1',
                ])
                ->assertRedirect();

            expect(Spender::where('name', 'Emma')->where('family_id', $family->id)->exists())->toBeTrue();
        });

        it('validates that name is required', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->post(route('spenders.store'), ['family_id' => $family->id])
                ->assertSessionHasErrors('name');
        });
    });

    describe('show', function () {
        it('allows a parent in the same family to view a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->get(route('spenders.show', $spenders->first()))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Spenders/Show'));
        });

        it('allows a linked child to view their spender', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->get(route('spenders.show', $spenders->first()))
                ->assertOk();
        });

        it('forbids an unrelated user from viewing a spender', function () {
            [, , $spenders] = parentWithFamily(['Emma']);
            $other = User::factory()->create();

            $this->actingAs($other)
                ->get(route('spenders.show', $spenders->first()))
                ->assertForbidden();
        });
    });

    describe('update', function () {
        it('updates a spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->patch(route('spenders.update', $spenders->first()), [
                    'family_id' => $spenders->first()->family_id,
                    'name'      => 'Emma-Updated',
                    'color'     => '#ff0000',
                ])
                ->assertRedirect();

            expect($spenders->first()->fresh()->name)->toBe('Emma-Updated');
        });
    });

    describe('destroy', function () {
        it('deletes a spender and redirects to the family', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->delete(route('spenders.destroy', $spender))
                ->assertRedirect();

            expect(Spender::find($spender->id))->toBeNull();
        });
    });
});
