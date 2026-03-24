<?php

use App\Http\Middleware\AuthenticateSpenderDevice;
use App\Http\Middleware\CollectCoverage;
use App\Http\Middleware\EnsureFamilyMember;
use App\Http\Middleware\EnsureFamilySubscribed;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequireParent;
use App\Http\Middleware\SwitchTestDatabase;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(prepend: [
            CollectCoverage::class,
            SwitchTestDatabase::class,
        ]);

        $middleware->web(append: [
            HandleCors::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'require.parent' => RequireParent::class,
            'ensure.family' => EnsureFamilyMember::class,
            'subscribed.family' => EnsureFamilySubscribed::class,
            'auth.spender_device' => AuthenticateSpenderDevice::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
