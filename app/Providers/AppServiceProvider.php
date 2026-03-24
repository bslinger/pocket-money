<?php

namespace App\Providers;

use App\Listeners\SyncUserToBento;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Event::listen(Registered::class, SyncUserToBento::class);

        $this->decodePushCredentials();
    }

    /**
     * Write base64-encoded push notification credentials to disk if provided
     * via environment variables (for Laravel Cloud / CI secrets).
     */
    private function decodePushCredentials(): void
    {
        $fcmBase64 = env('FCM_CREDENTIALS_BASE64');
        if ($fcmBase64) {
            $path = storage_path('app/firebase-credentials.json');
            if (! File::exists($path)) {
                File::ensureDirectoryExists(dirname($path));
                File::put($path, base64_decode($fcmBase64));
            }
        }

        $apnBase64 = env('APN_PRIVATE_KEY_BASE64');
        if ($apnBase64) {
            $path = storage_path('app/apns-auth-key.p8');
            if (! File::exists($path)) {
                File::ensureDirectoryExists(dirname($path));
                File::put($path, base64_decode($apnBase64));
            }
        }
    }
}
