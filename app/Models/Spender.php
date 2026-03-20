<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Spender extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'family_id',
        'name',
        'avatar_key',
        'color',
        'currency_name',
        'currency_name_plural',
        'currency_symbol',
        'use_integer_amounts',
    ];

    protected $casts = [
        'use_integer_amounts' => 'boolean',
    ];

    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->avatar_key
                ? Storage::temporaryUrl($this->avatar_key, now()->addMinutes(60))
                : ($this->attributes['avatar_url'] ?? null),
        );
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    /** @return HasMany<Account, $this> */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function spenderUsers(): HasMany
    {
        return $this->hasMany(SpenderUser::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'spender_users')
            ->withTimestamps();
    }

    public function savingsGoals(): HasMany
    {
        return $this->hasMany(SavingsGoal::class);
    }

    public function chores(): BelongsToMany
    {
        return $this->belongsToMany(Chore::class, 'chore_spender')->withTimestamps();
    }

    public function choreCompletions(): HasMany
    {
        return $this->hasMany(ChoreCompletion::class);
    }

    /** @return HasMany<ChoreReward, $this> */
    public function choreRewards(): HasMany
    {
        return $this->hasMany(ChoreReward::class);
    }
}
