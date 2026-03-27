<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Cashier\Billable;

class Family extends Model
{
    use Billable, HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'billing_user_id',
        'avatar_url',
        'currency_name',
        'currency_name_plural',
        'currency_symbol',
        'use_integer_amounts',
    ];

    protected $casts = [
        'use_integer_amounts' => 'boolean',
        'trial_ends_at' => 'datetime',
    ];

    /**
     * Whether this family has an active subscription or is on trial.
     */
    public function hasActiveAccess(): bool
    {
        return $this->onTrial() || $this->subscribed('default');
    }

    /**
     * Grant a 14-day free trial if the user has never had a trial on any family.
     */
    public function grantTrialIfEligible(User $user): void
    {
        $hasHadTrial = $user->families()
            ->whereNotNull('trial_ends_at')
            ->where('families.id', '!=', $this->id)
            ->exists();

        if (! $hasHadTrial) {
            $this->forceFill(['trial_ends_at' => now()->addDays(30)])->save();
        }
    }

    public function billingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'billing_user_id');
    }

    public function isBillingUser(User $user): bool
    {
        return $this->billing_user_id === $user->id;
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'family_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function familyUsers(): HasMany
    {
        return $this->hasMany(FamilyUser::class);
    }

    /** @return HasMany<Spender, $this> */
    public function spenders(): HasMany
    {
        return $this->hasMany(Spender::class);
    }

    public function chores(): HasMany
    {
        return $this->hasMany(Chore::class);
    }

    public function familyScreenDevices(): HasMany
    {
        return $this->hasMany(FamilyScreenDevice::class);
    }
}
