<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChildInvitation extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'spender_id',
        'email',
        'token',
        'expires_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at'  => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    public function isExpired(): bool
    {
        /** @var \Illuminate\Support\Carbon $expiresAt */
        $expiresAt = $this->expires_at;
        return $expiresAt->isPast();
    }
}
