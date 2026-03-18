<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\{
    DashboardController, FamilyController, SpenderController,
    AccountController, TransactionController, TransferController,
    RecurringTransactionController, SavingsGoalController,
    BillingController, SettingsController, ImageUploadController
};
use App\Http\Controllers\ProfileController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::delete('/settings/account', [SettingsController::class, 'deleteAccount'])->name('settings.account.destroy');
    Route::get('/settings/export', [SettingsController::class, 'exportData'])->name('settings.export');
    Route::post('/uploads/sign', [ImageUploadController::class, 'sign'])->name('uploads.sign');

    // Family routes available to any authenticated user (creating a family establishes parent status)
    Route::resource('families', FamilyController::class);
    Route::post('/families/{family}/invite', [FamilyController::class, 'invite'])->name('families.invite');

    Route::middleware('require.parent')->group(function () {
        Route::resource('spenders', SpenderController::class)->except('show');
        Route::resource('accounts', AccountController::class)->except('show');
        Route::resource('accounts.transactions', TransactionController::class);
        Route::resource('accounts.recurring', RecurringTransactionController::class);
        Route::resource('goals', SavingsGoalController::class);
        Route::get('/billing', [BillingController::class, 'index'])->name('billing');
        Route::post('/billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
        Route::post('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
    });

    // Wildcard show routes AFTER resource routes to avoid capturing /spenders/create etc.
    Route::get('/spenders/{spender}', [SpenderController::class, 'show'])->name('spenders.show');
    Route::get('/accounts/{account}', [AccountController::class, 'show'])->name('accounts.show');
    Route::post('/accounts/{account}/transfer', [TransferController::class, 'store'])->name('accounts.transfer');
});

Route::post('/webhooks/stripe', [\Laravel\Cashier\Http\Controllers\WebhookController::class, 'handleWebhook']);

require __DIR__.'/auth.php';

// Local dev only: auto-verify email without needing SES
if (app()->environment('local')) {
    Route::get('/dev/verify-email', function () {
        auth()->user()?->update(['email_verified_at' => now()]);
        return redirect('/dashboard');
    })->middleware('auth');
}
