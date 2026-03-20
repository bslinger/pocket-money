<?php

namespace App\Models;

use App\Enums\CompletionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChoreCompletion extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'chore_id',
        'spender_id',
        'status',
        'completed_at',
        'reviewed_at',
        'reviewed_by',
        'note',
        'transaction_id',
    ];

    protected $casts = [
        'status'       => CompletionStatus::class,
        'completed_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    /** @return BelongsTo<Chore, $this> */
    public function chore(): BelongsTo
    {
        return $this->belongsTo(Chore::class);
    }

    /** @return BelongsTo<Spender, $this> */
    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
