<?php

namespace App\Models;

use App\Enums\Frequency;
use App\Enums\TxType;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property TxType   $type
 * @property Frequency $frequency
 * @property Carbon   $next_run_at
 */
class RecurringTransaction extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'account_id',
        'type',
        'amount',
        'description',
        'frequency',
        'frequency_config',
        'next_run_at',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => TxType::class,
            'amount' => 'decimal:2',
            'frequency' => Frequency::class,
            'frequency_config' => 'array',
            'next_run_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function skips(): HasMany
    {
        return $this->hasMany(RecurringTransactionSkip::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
