<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SpenderDevice extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'spender_id',
        'device_name',
        'token',
        'last_active_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'last_active_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SpenderDevice $device): void {
            if (! $device->token) {
                $device->token = hash('sha256', Str::random(40));
            }
        });
    }

    public function spender(): BelongsTo
    {
        return $this->belongsTo(Spender::class);
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isActive(): bool
    {
        return ! $this->isRevoked();
    }

    public function revoke(): void
    {
        $this->update(['revoked_at' => now()]);
    }

    public function touchLastActive(): void
    {
        $this->update(['last_active_at' => now()]);
    }

    public static function findByToken(string $hashedToken): ?self
    {
        return static::where('token', $hashedToken)
            ->whereNull('revoked_at')
            ->first();
    }

    public static function createForSpender(Spender $spender, string $deviceName = ''): self
    {
        $plainToken = Str::random(40);

        $device = static::create([
            'spender_id' => $spender->id,
            'device_name' => $deviceName,
            'token' => hash('sha256', $plainToken),
        ]);

        // Store the plain token temporarily so the controller can return it
        $device->plainToken = $plainToken;

        return $device;
    }

    /**
     * Temporary storage for the unhashed token (only available at creation time).
     */
    public string $plainToken = '';
}
