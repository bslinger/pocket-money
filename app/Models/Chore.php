<?php

namespace App\Models;

use App\Enums\ChoreFrequency;
use App\Enums\ChoreRewardType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chore extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'family_id',
        'name',
        'emoji',
        'reward_type',
        'amount',
        'frequency',
        'days_of_week',
        'requires_approval',
        'up_for_grabs',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'reward_type'       => ChoreRewardType::class,
        'frequency'         => ChoreFrequency::class,
        'days_of_week'      => 'array',
        'requires_approval' => 'boolean',
        'up_for_grabs'      => 'boolean',
        'is_active'         => 'boolean',
        'amount'            => 'decimal:2',
    ];

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function spenders(): BelongsToMany
    {
        return $this->belongsToMany(Spender::class, 'chore_spender')->withTimestamps();
    }

    public function completions(): HasMany
    {
        return $this->hasMany(ChoreCompletion::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
