<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Account extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'spender_id',
        'name',
        'balance',
        'is_savings_pot',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'is_savings_pot' => 'boolean',
        ];
    }

    /** @return BelongsTo<Spender, $this> */
    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function recurringTransactions(): HasMany
    {
        return $this->hasMany(RecurringTransaction::class);
    }

    public function savingsGoal(): HasOne
    {
        return $this->hasOne(SavingsGoal::class);
    }
}
