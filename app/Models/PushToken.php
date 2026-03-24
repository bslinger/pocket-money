<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PushToken extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tokenable_type',
        'tokenable_id',
        'token',
        'platform',
    ];

    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Register a push token for a model, replacing any existing token with the same value.
     */
    public static function register(Model $tokenable, string $token, string $platform): self
    {
        // Remove existing token if registered to a different entity
        static::where('token', $token)->delete();

        return static::create([
            'tokenable_type' => $tokenable->getMorphClass(),
            'tokenable_id' => $tokenable->getKey(),
            'token' => $token,
            'platform' => $platform,
        ]);
    }

    /**
     * Unregister a push token.
     */
    public static function unregister(string $token): void
    {
        static::where('token', $token)->delete();
    }
}
