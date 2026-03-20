<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class SavingsGoal extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $appends = ['image_url'];

    protected $fillable = [
        'spender_id',
        'account_id',
        'name',
        'target_amount',
        'current_amount',
        'image_key',
        'target_date',
        'is_completed',
    ];

    protected function casts(): array
    {
        return [
            'target_amount' => 'decimal:2',
            'current_amount' => 'decimal:2',
            'target_date' => 'date',
            'is_completed' => 'boolean',
        ];
    }

    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->image_key
                ? Storage::temporaryUrl($this->image_key, now()->addMinutes(60))
                : null,
        );
    }
}
