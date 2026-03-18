<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpenderUser extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'spender_users';

    protected $fillable = [
        'spender_id',
        'user_id',
    ];

    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
