<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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

    protected static function booted(): void
    {
        static::creating(function (Family $family) {
            if ($family->trial_ends_at === null && $family->stripe_id === null) {
                $family->trial_ends_at = now()->addDays(14);
            }
        });
    }

    /**
     * Whether this family has an active subscription or is on trial.
     */
    public function hasActiveAccess(): bool
    {
        return $this->onTrial() || $this->subscribed('default');
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
}
