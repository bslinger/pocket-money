<?php

namespace App\Providers;

use App\Listeners\SyncUserToLoops;
use App\Listeners\TrackSubscriptionEvent;
use App\Listeners\TrackUserRegistered;
use App\Services\AnalyticsService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Events\WebhookReceived;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AnalyticsService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Event::listen(Registered::class, SyncUserToLoops::class);
        Event::listen(Registered::class, TrackUserRegistered::class);
        Event::listen(WebhookReceived::class, TrackSubscriptionEvent::class);

        $this->decodePushCredentials();
    }

    /**
     * Write base64-encoded push notification credentials to disk if provided
     * via environment variables (for Laravel Cloud / CI secrets).
     */
    private function decodePushCredentials(): void
    {
        $fcmBase64 = config('services.fcm.credentials_base64');
        if ($fcmBase64) {
            $path = storage_path('app/firebase-credentials.json');
            if (! File::exists($path)) {
                File::ensureDirectoryExists(dirname($path));
                File::put($path, base64_decode($fcmBase64));
            }
        }

        $apnBase64 = config('services.apn.private_key_base64');
        if ($apnBase64) {
            $path = storage_path('app/apns-auth-key.p8');
            if (! File::exists($path)) {
                File::ensureDirectoryExists(dirname($path));
                File::put($path, base64_decode($apnBase64));
            }
        }
    }
}
