<?php

namespace App\Models;

use App\Http\Controllers\ImageUploadController;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Spender extends Model
{
    use HasFactory, HasUuids, Notifiable, SoftDeletes;

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
            get: fn () => $this->avatar_key
                ? ImageUploadController::url($this->avatar_key)
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

    /** @return HasMany<SavingsGoal, $this> */
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

    /** @return HasMany<PocketMoneySchedule, $this> */
    public function pocketMoneySchedules(): HasMany
    {
        return $this->hasMany(PocketMoneySchedule::class);
    }

    /** @return HasMany<ChoreReward, $this> */
    public function choreRewards(): HasMany
    {
        return $this->hasMany(ChoreReward::class);
    }

    /** @return HasMany<ChildInvitation, $this> */
    public function childInvitations(): HasMany
    {
        return $this->hasMany(ChildInvitation::class);
    }

    /** @return HasMany<SpenderLinkCode, $this> */
    public function linkCodes(): HasMany
    {
        return $this->hasMany(SpenderLinkCode::class);
    }

    /** @return HasMany<SpenderDevice, $this> */
    public function devices(): HasMany
    {
        return $this->hasMany(SpenderDevice::class);
    }

    /** @return MorphMany<PushToken, $this> */
    public function pushTokens(): MorphMany
    {
        return $this->morphMany(PushToken::class, 'tokenable');
    }

    /** @return array<int, string> */
    public function routeNotificationForFcm(): array
    {
        return $this->pushTokens()->where('platform', 'android')->pluck('token')->all();
    }

    /** @return array<int, string> */
    public function routeNotificationForApn(): array
    {
        return $this->pushTokens()->where('platform', 'ios')->pluck('token')->all();
    }
}
