<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Carbon $scheduled_for
 */
class PocketMoneyEvent extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'spender_id',
        'schedule_id',
        'scheduled_for',
        'amount',
        'status',
        'transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_for' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Spender, $this> */
    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    /** @return BelongsTo<PocketMoneySchedule, $this> */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(PocketMoneySchedule::class);
    }

    /** @return BelongsTo<Transaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
