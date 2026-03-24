<?php

use App\Models\Spender;
use Illuminate\Support\Facades\Broadcast;

// Parent channel — user must belong to this family
Broadcast::channel('family.{familyId}', function ($user, string $familyId) {
    return $user->families()->where('families.id', $familyId)->exists();
});

// Spender channel — parent in the family OR child linked to the spender
Broadcast::channel('spender.{spenderId}', function ($user, string $spenderId) {
    $spender = Spender::find($spenderId);
    if (! $spender) {
        return false;
    }

    // Parent in the spender's family
    if ($user->families()->where('families.id', $spender->family_id)->exists()) {
        return true;
    }

    // Child linked to this spender
    return $user->spenders()->where('spenders.id', $spenderId)->exists();
});
