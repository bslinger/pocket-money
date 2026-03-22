<?php

test('spender can be updated with any valid hex colour from the extended palette', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    // Colour from the extended (non-default-visible) palette
    $extendedColour = '#7f1d1d';

    $this->actingAs($user)
        ->put(route('spenders.update', $spender->id), [
            'family_id' => $family->id,
            'name' => $spender->name,
            'color' => $extendedColour,
        ])
        ->assertRedirect();

    expect($spender->fresh()->color)->toBe($extendedColour);
});

test('spender can be updated with a colour from the default visible palette', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $this->actingAs($user)
        ->put(route('spenders.update', $spender->id), [
            'family_id' => $family->id,
            'name' => $spender->name,
            'color' => '#6366f1',
        ])
        ->assertRedirect();

    expect($spender->fresh()->color)->toBe('#6366f1');
});

test('spender colour must be a valid hex value', function () {
    [$user, $family, $spenders] = parentWithFamily(['Emma']);
    $spender = $spenders->first();

    $this->actingAs($user)
        ->put(route('spenders.update', $spender->id), [
            'family_id' => $family->id,
            'name' => $spender->name,
            'color' => 'not-a-colour',
        ])
        ->assertSessionHasErrors('color');
});
