<?php

use App\Mail\ChildInvitationMail;
use App\Models\ChildInvitation;
use App\Models\Spender;
use App\Models\SpenderUser;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

describe('spenders', function () {

    describe('index', function () {
        it('shows the spenders index page for a parent', function () {
            [$user] = parentWithFamily(['Emma', 'Jack']);

            $this->actingAs($user)
                ->get(route('spenders.index'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Spenders/Index')
                    ->has('family')
                    ->has('spenders', 2)
                );
        });

        it('redirects to family create when no family exists', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->get(route('spenders.index'))
                ->assertForbidden();
        });
    });

    describe('edit', function () {
        it('renders the edit form for a parent', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);

            $this->actingAs($user)
                ->get(route('spenders.edit', $spenders->first()))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Spenders/Edit')
                    ->has('spender')
                    ->has('family')
                );
        });
    });

    describe('create / store', function () {
        it('shows the create form to a parent', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('spenders.create'))
                ->assertOk()
                ->assertInertia(fn ($page) => $page->component('Spenders/Create'));
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
                    'name' => 'Emma',
                    'color' => '#6366f1',
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
                ->assertInertia(fn ($page) => $page->component('Spenders/Show'));
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
                    'name' => 'Emma-Updated',
                    'color' => '#ff0000',
                ])
                ->assertRedirect();

            expect($spenders->first()->fresh()->name)->toBe('Emma-Updated');
        });
    });

    describe('archive / restore', function () {
        it('soft-deletes (archives) a spender and redirects to the family', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->delete(route('spenders.destroy', $spender))
                ->assertRedirect(route('families.show', $family->id));

            expect(Spender::find($spender->id))->toBeNull();
            expect(Spender::withTrashed()->find($spender->id))->not->toBeNull();
        });

        it('restores an archived spender', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $spender->delete();

            $this->actingAs($user)
                ->post(route('spenders.restore', $spender->id))
                ->assertRedirect();

            expect(Spender::find($spender->id))->not->toBeNull();
        });
    });

    describe('link-child', function () {
        it('links a user account to a spender by email', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = User::factory()->create(['email' => 'kid@example.com']);

            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender), ['email' => 'kid@example.com'])
                ->assertRedirect();

            expect(SpenderUser::where('spender_id', $spender->id)
                ->where('user_id', $child->id)->exists())->toBeTrue();
        });

        it('sends a child invitation email for an unknown email address', function () {
            Mail::fake();
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender), ['email' => 'nobody@example.com'])
                ->assertRedirect();

            expect(ChildInvitation::where('spender_id', $spender->id)
                ->where('email', 'nobody@example.com')
                ->exists()
            )->toBeTrue();

            Mail::assertSent(ChildInvitationMail::class);
        });

        it('does not create duplicate links', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = User::factory()->create(['email' => 'kid2@example.com']);

            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender), ['email' => 'kid2@example.com']);
            $this->actingAs($user)
                ->post(route('spenders.link-child', $spender), ['email' => 'kid2@example.com']);

            expect(SpenderUser::where('spender_id', $spender->id)
                ->where('user_id', $child->id)->count())->toBe(1);
        });
    });

    describe('unlink-child', function () {
        it('removes the spender-user link', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = childLinkedTo($spender);

            $this->actingAs($user)
                ->delete(route('spenders.unlink-child', [$spender, $child]))
                ->assertRedirect();

            expect(SpenderUser::where('spender_id', $spender->id)
                ->where('user_id', $child->id)->exists())->toBeFalse();
        });
    });

    describe('view-as', function () {
        it('stores the spender id in session and redirects to dashboard', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->post(route('dashboard.view-as', $spender))
                ->assertRedirect(route('dashboard'))
                ->assertSessionHas('viewing_as_spender_id', $spender->id);
        });

        it('clears the session on exit and redirects to dashboard by default', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();

            $this->actingAs($user)
                ->withSession(['viewing_as_spender_id' => $spender->id])
                ->delete(route('dashboard.exit-view-as'))
                ->assertRedirect(route('dashboard'));

            expect(session('viewing_as_spender_id'))->toBeNull();
        });

        it('redirects back to the originating page on exit', function () {
            [$user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $returnUrl = route('spenders.show', $spender);

            $this->actingAs($user)
                ->withSession([
                    'viewing_as_spender_id' => $spender->id,
                    'view_as_return_url' => $returnUrl,
                ])
                ->delete(route('dashboard.exit-view-as'))
                ->assertRedirect($returnUrl);
        });

        it('forbids a non-parent from activating view-as', function () {
            [$_user, , $spenders] = parentWithFamily(['Emma']);
            $spender = $spenders->first();
            $child = childLinkedTo($spender);

            $this->actingAs($child)
                ->post(route('dashboard.view-as', $spender))
                ->assertForbidden();
        });
    });
});
