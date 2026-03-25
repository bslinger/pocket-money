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
use Illuminate\Database\Eloquent\SoftDeletes;

class Chore extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

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
        'day_of_month',
        'one_off_date',
        'requires_approval',
        'up_for_grabs',
        'is_active',
        'created_by',
    ];

    protected $attributes = [
        'emoji' => '🧹',
    ];

    protected $casts = [
        'reward_type' => ChoreRewardType::class,
        'frequency' => ChoreFrequency::class,
        'days_of_week' => 'array',
        'day_of_month' => 'integer',
        'one_off_date' => 'date',
        'requires_approval' => 'boolean',
        'up_for_grabs' => 'boolean',
        'is_active' => 'boolean',
        'amount' => 'decimal:2',
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

    /**
     * Hard-delete if no completions exist, otherwise soft-delete
     * so historical completion data can still reference the chore.
     */
    public function deleteOrForceDelete(): bool
    {
        if ($this->completions()->doesntExist()) {
            return (bool) $this->forceDelete();
        }

        return (bool) $this->delete();
    }
}
