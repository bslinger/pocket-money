<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PocketMoneyScheduleSplit extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'pocket_money_schedule_id',
        'account_id',
        'percentage',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:4',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<PocketMoneySchedule, $this> */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(PocketMoneySchedule::class, 'pocket_money_schedule_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
