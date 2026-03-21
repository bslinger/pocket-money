<?php

namespace App\Models;

use App\Http\Controllers\ImageUploadController;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $allocated_amount
 */
class SavingsGoal extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $appends = ['image_url', 'allocated_amount'];

    protected $fillable = [
        'spender_id',
        'account_id',
        'name',
        'target_amount',
        'image_key',
        'target_date',
        'is_completed',
        'completed_at',
        'abandoned_at',
        'abandoned_allocated_amount',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'target_amount' => 'decimal:2',
            'abandoned_allocated_amount' => 'decimal:2',
            'target_date' => 'date',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
            'abandoned_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->image_key
                ? ImageUploadController::url($this->image_key)
                : null,
        );
    }

    protected function allocatedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->attributes['allocated_amount'] ?? '0.00',
        );
    }

    /**
     * Distribute an account balance across goals in sort_order priority.
     * Sets 'allocated_amount' on each goal.
     *
     * @param  iterable<SavingsGoal>  $goals  Already sorted by sort_order.
     * @param  float  $balance  Account balance to distribute.
     */
    public static function computeAllocations(iterable $goals, float $balance): void
    {
        $remaining = $balance;
        foreach ($goals as $goal) {
            $target = (float) $goal->target_amount;
            $allocated = min($remaining, $target);
            $remaining = max(0.0, $remaining - $allocated);
            $goal->setAttribute('allocated_amount', number_format($allocated, 2, '.', ''));
        }
    }

    /**
     * Group goals by account and apply cascade allocations in place.
     * Expects goals already sorted by sort_order.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, SavingsGoal>  $goals
     */
    public static function applyAccountAllocations(\Illuminate\Database\Eloquent\Collection $goals): void
    {
        /** @var array<string, SavingsGoal[]> $byAccount */
        $byAccount = [];
        foreach ($goals as $goal) {
            $byAccount[$goal->account_id ?? ''][] = $goal;
        }

        foreach ($byAccount as $accountGoals) {
            $first = $accountGoals[0] ?? null;
            $balance = ($first !== null && $first->account instanceof Account)
                ? (float) $first->account->balance
                : 0.0;
            self::computeAllocations($accountGoals, $balance);
        }
    }
}
