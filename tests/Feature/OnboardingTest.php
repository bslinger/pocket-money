<?php

use App\Models\Account;
use App\Models\Chore;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Models\User;
use App\Enums\FamilyRole;

describe('onboarding', function () {

    describe('show (GET /onboarding)', function () {
        it('redirects guests to login', function () {
            $this->get(route('onboarding'))
                ->assertRedirect(route('login'));
        });

        it('redirects unverified users to verify-email', function () {
            $user = User::factory()->unverified()->create();

            $this->actingAs($user)
                ->get(route('onboarding'))
                ->assertRedirect(route('verification.notice'));
        });

        it('shows the onboarding page for a verified user with no family', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->get(route('onboarding'))
                ->assertOk()
                ->assertInertia(fn($page) => $page->component('Onboarding/Index'));
        });

        it('redirects to continue page if user already has a family', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('onboarding'))
                ->assertRedirect(route('onboarding.continue', $family));
        });
    });

    describe('dashboard redirect for new users', function () {
        it('redirects a brand-new verified user visiting /dashboard to onboarding', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->get(route('dashboard'))
                ->assertRedirect(route('onboarding'));
        });

        it('does not redirect a parent user to onboarding', function () {
            [$user] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('dashboard'))
                ->assertOk();
        });

        it('does not redirect a child user to onboarding', function () {
            [$_parent, , $spenders] = parentWithFamily(['Emma']);
            $child = childLinkedTo($spenders->first());

            $this->actingAs($child)
                ->get(route('dashboard'))
                ->assertOk();
        });
    });

    describe('store (POST /onboarding)', function () {
        it('redirects guests to login', function () {
            $this->post(route('onboarding.store'), ['name' => 'Test'])
                ->assertRedirect(route('login'));
        });

        it('creates a family with name and currency settings', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('onboarding.store'), [
                    'name'                 => 'The Smiths',
                    'currency_symbol'      => '$',
                    'currency_name'        => 'Dollar',
                    'currency_name_plural' => 'Dollars',
                    'use_integer_amounts'  => false,
                ])
                ->assertRedirect();

            $family = Family::where('name', 'The Smiths')->first();
            expect($family)->not->toBeNull();
            expect($family->currency_symbol)->toBe('$');
            expect($family->currency_name)->toBe('Dollar');

            $pivot = FamilyUser::where('family_id', $family->id)
                ->where('user_id', $user->id)
                ->first();
            expect($pivot)->not->toBeNull();
            expect($pivot->role)->toBe(FamilyRole::Admin);
        });

        it('redirects to the continue page after creating a family', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->post(route('onboarding.store'), [
                    'name' => 'The Smiths',
                ]);

            $family = Family::where('name', 'The Smiths')->first();
            $response->assertRedirect(route('onboarding.continue', $family));
        });

        it('creates spenders and accounts when kids are provided', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('onboarding.store'), [
                    'name'     => 'The Jones',
                    'spenders' => [
                        ['name' => 'Alice', 'color' => '#6366f1'],
                        ['name' => 'Bob',   'color' => '#8b5cf6'],
                    ],
                ]);

            $family = Family::where('name', 'The Jones')->first();
            expect($family->spenders()->count())->toBe(2);

            $alice = Spender::where('name', 'Alice')->first();
            expect($alice)->not->toBeNull();
            expect($alice->accounts()->count())->toBe(1);
        });

        it('sets the starting balance on accounts when provided', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('onboarding.store'), [
                    'name'     => 'The Bakers',
                    'spenders' => [
                        ['name' => 'Lily', 'color' => '#6366f1', 'balance' => '12.50'],
                        ['name' => 'Tom',  'color' => '#8b5cf6', 'balance' => '0'],
                    ],
                ]);

            $lily = Spender::where('name', 'Lily')->first();
            expect((float) $lily->accounts()->first()->balance)->toBe(12.5);

            $tom = Spender::where('name', 'Tom')->first();
            expect((float) $tom->accounts()->first()->balance)->toBe(0.0);
        });

        it('defaults balance to zero when not provided', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('onboarding.store'), [
                    'name'     => 'The Hills',
                    'spenders' => [
                        ['name' => 'Sam', 'color' => '#6366f1'],
                    ],
                ]);

            $sam = Spender::where('name', 'Sam')->first();
            expect((float) $sam->accounts()->first()->balance)->toBe(0.0);
        });

        it('validates that name is required', function () {
            $user = User::factory()->create();

            $this->actingAs($user)
                ->post(route('onboarding.store'), [])
                ->assertSessionHasErrors('name');
        });
    });

    describe('showContinue (GET /onboarding/{family}/continue)', function () {
        it('shows the continue page for a family member', function () {
            [$user, $family] = parentWithFamily();

            $this->actingAs($user)
                ->get(route('onboarding.continue', $family))
                ->assertOk()
                ->assertInertia(fn($page) => $page
                    ->component('Onboarding/Continue')
                    ->has('family')
                );
        });

        it('returns 403 for a user who is not a member of the family', function () {
            [, $family] = parentWithFamily();
            $otherUser = User::factory()->create();

            $this->actingAs($otherUser)
                ->get(route('onboarding.continue', $family))
                ->assertForbidden();
        });

        it('requires authentication', function () {
            [, $family] = parentWithFamily();

            $this->get(route('onboarding.continue', $family))
                ->assertRedirect(route('login'));
        });
    });

    describe('storePocketMoney (POST /onboarding/{family}/pocket-money)', function () {
        it('creates pocket money schedules for spenders', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);
            $emma = $spenders->first();
            $jack = $spenders->last();

            $this->actingAs($user)
                ->post(route('onboarding.pocket-money', $family), [
                    'schedules' => [
                        [
                            'spender_id'  => $emma->id,
                            'amount'      => '5.00',
                            'frequency'   => 'weekly',
                            'day_of_week' => 0,
                        ],
                        [
                            'spender_id'   => $jack->id,
                            'amount'       => '10.00',
                            'frequency'    => 'monthly',
                            'day_of_month' => 15,
                        ],
                    ],
                ])
                ->assertRedirect();

            expect(PocketMoneySchedule::where('spender_id', $emma->id)->where('is_active', true)->count())->toBe(1);
            $emmaSchedule = PocketMoneySchedule::where('spender_id', $emma->id)->first();
            expect($emmaSchedule->amount)->toBe('5.00');
            expect($emmaSchedule->frequency)->toBe('weekly');

            expect(PocketMoneySchedule::where('spender_id', $jack->id)->where('is_active', true)->count())->toBe(1);
            $jackSchedule = PocketMoneySchedule::where('spender_id', $jack->id)->first();
            expect($jackSchedule->amount)->toBe('10.00');
            expect($jackSchedule->frequency)->toBe('monthly');
        });

        it('returns 403 if user is not a family member', function () {
            [, $family, $spenders] = parentWithFamily(['Emma']);
            $otherUser = User::factory()->create();

            $this->actingAs($otherUser)
                ->post(route('onboarding.pocket-money', $family), [
                    'schedules' => [
                        ['spender_id' => $spenders->first()->id, 'amount' => '5.00', 'frequency' => 'weekly'],
                    ],
                ])
                ->assertForbidden();
        });
    });

    describe('storeChores (POST /onboarding/{family}/chores)', function () {
        it('creates chores and assigns them to spenders', function () {
            [$user, $family, $spenders] = parentWithFamily(['Emma', 'Jack']);

            $this->actingAs($user)
                ->post(route('onboarding.chores', $family), [
                    'chores' => [
                        [
                            'name'        => 'Tidy bedroom',
                            'emoji'       => '🛏️',
                            'reward_type' => 'earns',
                            'amount'      => '2.00',
                            'frequency'   => 'weekly',
                            'spender_ids' => $spenders->pluck('id')->toArray(),
                        ],
                        [
                            'name'        => 'Feed the dog',
                            'emoji'       => '🐶',
                            'reward_type' => 'responsibility',
                            'amount'      => null,
                            'frequency'   => 'daily',
                            'spender_ids' => [$spenders->first()->id],
                        ],
                    ],
                ])
                ->assertRedirect();

            expect(Chore::where('family_id', $family->id)->count())->toBe(2);

            $chore = Chore::where('name', 'Tidy bedroom')->first();
            expect($chore)->not->toBeNull();
            expect($chore->spenders()->count())->toBe(2);
            expect($chore->reward_type->value)->toBe('earns');

            $dogChore = Chore::where('name', 'Feed the dog')->first();
            expect($dogChore->spenders()->count())->toBe(1);
        });

        it('returns 403 if user is not a family member', function () {
            [, $family, $spenders] = parentWithFamily(['Emma']);
            $otherUser = User::factory()->create();

            $this->actingAs($otherUser)
                ->post(route('onboarding.chores', $family), [
                    'chores' => [
                        [
                            'name'        => 'Test',
                            'reward_type' => 'earns',
                            'amount'      => '1.00',
                            'frequency'   => 'weekly',
                            'spender_ids' => [$spenders->first()->id],
                        ],
                    ],
                ])
                ->assertForbidden();
        });
    });
});
