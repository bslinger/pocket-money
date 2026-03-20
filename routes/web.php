<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\{
    DashboardController, FamilyController, SpenderController,
    AccountController, TransactionController, TransferController,
    RecurringTransactionController, SavingsGoalController,
    BillingController, SettingsController, ImageUploadController,
    ChoreController, ChoreCompletionController, PocketMoneyReleaseController,
    MarketingController
};
use App\Http\Controllers\ProfileController;

Route::get('/', [MarketingController::class, 'home'])->name('home');
Route::get('/how-it-works', [MarketingController::class, 'howItWorks'])->name('marketing.how');
Route::get('/pricing', [MarketingController::class, 'pricing'])->name('marketing.pricing');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::match(['put', 'patch'], '/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::delete('/settings/account', [SettingsController::class, 'deleteAccount'])->name('settings.account.destroy');
    Route::get('/settings/export', [SettingsController::class, 'exportData'])->name('settings.export');
    Route::post('/uploads/sign', [ImageUploadController::class, 'sign'])->name('uploads.sign');

    // Family routes available to any authenticated user (creating a family establishes parent status)
    Route::resource('families', FamilyController::class);
    Route::post('/families/{family}/switch', [FamilyController::class, 'switchActive'])->name('families.switch');
    Route::post('/families/{family}/invite', [FamilyController::class, 'invite'])->name('families.invite');
    Route::delete('/families/{family}/members/{user}', [FamilyController::class, 'removeMember'])->name('families.members.destroy');
    Route::patch('/families/{family}/members/{user}/role', [FamilyController::class, 'updateMemberRole'])->name('families.members.role');

    // Kid-facing chore completion (any authenticated + verified user)
    Route::post('/chores/{chore}/complete', [ChoreCompletionController::class, 'store'])->name('chores.complete');

    Route::middleware('require.parent')->group(function () {
        Route::resource('spenders', SpenderController::class)->except('show');
        Route::resource('accounts', AccountController::class)->except('show');
        Route::resource('accounts.transactions', TransactionController::class);
        Route::resource('accounts.recurring', RecurringTransactionController::class);
        Route::resource('goals', SavingsGoalController::class);
        Route::get('/billing', [BillingController::class, 'index'])->name('billing');
        Route::post('/billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
        Route::post('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');

        Route::resource('chores', ChoreController::class)->except('show');
        Route::patch('/chore-completions/{completion}/approve', [ChoreCompletionController::class, 'approve'])->name('chore-completions.approve');
        Route::patch('/chore-completions/{completion}/decline', [ChoreCompletionController::class, 'decline'])->name('chore-completions.decline');
        Route::get('/pocket-money/release', [PocketMoneyReleaseController::class, 'index'])->name('pocket-money.release');
        Route::post('/pocket-money/release', [PocketMoneyReleaseController::class, 'pay'])->name('pocket-money.pay');
    });

    // Wildcard show routes AFTER resource routes to avoid capturing /spenders/create etc.
    Route::get('/spenders/{spender}', [SpenderController::class, 'show'])->name('spenders.show');
    Route::get('/accounts/{account}', [AccountController::class, 'show'])->name('accounts.show');
    Route::get('/accounts/{account}/transfer', [TransferController::class, 'create'])->name('accounts.transfer.create');
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
