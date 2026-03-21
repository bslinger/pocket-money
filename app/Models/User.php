<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'email',
        'password',
        'display_name',
        'parent_title',
        'avatar_url',
        'stripe_customer_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function familyUsers(): HasMany
    {
        return $this->hasMany(FamilyUser::class);
    }

    /** @return BelongsToMany<Family, $this> */
    public function families(): BelongsToMany
    {
        return $this->belongsToMany(Family::class, 'family_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function spenderUsers(): HasMany
    {
        return $this->hasMany(SpenderUser::class);
    }

    /** @return BelongsToMany<Spender, $this> */
    public function spenders(): BelongsToMany
    {
        return $this->belongsToMany(Spender::class, 'spender_users')
            ->withTimestamps();
    }

    public function isParent(): bool
    {
        return $this->familyUsers()->exists();
    }

    public function isChildFor(Spender $spender): bool
    {
        return $this->spenderUsers()->where('spender_id', $spender->id)->exists();
    }
}
