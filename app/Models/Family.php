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
    use HasFactory, HasUuids, Billable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'avatar_url',
        'currency_name',
        'currency_symbol',
    ];

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
