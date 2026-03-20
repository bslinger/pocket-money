<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Carbon|null $next_run_at
 */
class PocketMoneySchedule extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'spender_id',
        'amount',
        'frequency',
        'day_of_week',
        'day_of_month',
        'is_active',
        'next_run_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount'       => 'decimal:2',
            'is_active'    => 'boolean',
            'next_run_at'  => 'datetime',
            'day_of_week'  => 'integer',
            'day_of_month' => 'integer',
        ];
    }

    /** @return BelongsTo<Spender, $this> */
    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Compute the first upcoming run date based on frequency and day setting.
     * Used when creating or activating a schedule.
     */
    public static function computeNextRunAt(string $frequency, ?int $dayOfWeek, ?int $dayOfMonth): Carbon
    {
        $now = now();

        if ($frequency === 'weekly') {
            // day_of_week: 0=Mon…6=Sun (ChoreForm convention)
            // Carbon dayOfWeek: 0=Sun, 1=Mon…6=Sat
            $targetCarbonDay = $dayOfWeek !== null
                ? ($dayOfWeek === 6 ? Carbon::SUNDAY : $dayOfWeek + 1)
                : Carbon::MONDAY;

            $next = $now->copy()->startOfDay()->next($targetCarbonDay);
            // If today is the target day and it's still early, use today
            if ($now->dayOfWeek === $targetCarbonDay) {
                $next = $now->copy()->startOfDay();
            }
            return $next;
        }

        // monthly
        $target = $dayOfMonth ?? 1;
        $next = $now->copy()->setDay(min($target, $now->daysInMonth))->startOfDay();
        if ($next->lte($now)) {
            $next->addMonth()->setDay(min($target, $next->daysInMonth));
        }
        return $next;
    }
}
