<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property bool $is_paid
 * @property string|null $payout_date
 * @property \Illuminate\Database\Eloquent\Collection<int, Chore> $chores
 */
class ChoreReward extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'spender_id',
        'account_id',
        'amount',
        'description',
        'payout_date',
        'is_paid',
        'paid_at',
        'transaction_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount'      => 'decimal:2',
            'is_paid'     => 'boolean',
            'paid_at'     => 'datetime',
            'payout_date' => 'date:Y-m-d',
        ];
    }

    /** @return BelongsTo<Spender, $this> */
    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return BelongsTo<Transaction, $this> */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /** @return BelongsToMany<Chore, $this> */
    public function chores(): BelongsToMany
    {
        return $this->belongsToMany(Chore::class, 'chore_chore_reward');
    }

    /**
     * Check if all required chores have been completed/approved this period.
     */
    public function allChoresCompleted(): bool
    {
        $approvedChoreIds = $this->spender->choreCompletions()
            ->where('status', 'approved')
            ->pluck('chore_id')
            ->unique();

        return $this->chores->every(
            fn(Chore $chore) => $approvedChoreIds->contains($chore->id)
        );
    }
}
