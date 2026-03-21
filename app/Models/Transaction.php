<?php

namespace App\Models;

use App\Enums\TxType;
use App\Http\Controllers\ImageUploadController;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property TxType $type
 */
class Transaction extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'account_id',
        'type',
        'amount',
        'description',
        'image_key',
        'transfer_group_id',
        'occurred_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => TxType::class,
            'amount' => 'decimal:2',
            'occurred_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function imageUrl(): ?string
    {
        if ($this->image_key === null) {
            return null;
        }

        return ImageUploadController::url($this->image_key);
    }
}
