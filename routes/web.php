<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BillingTransferController;
use App\Http\Controllers\ChildInvitationController;
use App\Http\Controllers\ChoreCompletionController;
use App\Http\Controllers\ChoreController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PocketMoneyReleaseController;
use App\Http\Controllers\PocketMoneyScheduleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecurringTransactionController;
use App\Http\Controllers\SavingsGoalController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SpenderController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransferController;
use Illuminate\Support\Facades\Route;
use Laravel\Cashier\Http\Controllers\WebhookController;

// Landing page now lives at quiddo.com.au (GitHub Pages, /landing directory)
Route::get('/', fn () => auth()->check() ? redirect('/dashboard') : redirect('/login'))->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Invitation accept — works for both logged-in and guest users
Route::get('/invitations/{token}/accept', [InvitationController::class, 'accept'])
    ->middleware('auth')
    ->name('invitations.accept');

// Child invitation accept — accessible to guests (redirects to login if needed)
Route::get('/child-invitations/{token}/accept', [ChildInvitationController::class, 'accept'])
    ->name('child-invitations.accept');

Route::middleware(['auth'])->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
    Route::get('/onboarding/{family}/continue', [OnboardingController::class, 'showContinue'])->name('onboarding.continue');
    Route::post('/onboarding/{family}/pocket-money', [OnboardingController::class, 'storePocketMoney'])->name('onboarding.pocket-money');
    Route::post('/onboarding/{family}/chores', [OnboardingController::class, 'storeChores'])->name('onboarding.chores');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/spenders/{spender}/view-as', [DashboardController::class, 'viewAs'])->name('dashboard.view-as');
    Route::delete('/view-as', [DashboardController::class, 'exitViewAs'])->name('dashboard.exit-view-as');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::match(['put', 'patch'], '/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::delete('/settings/account', [SettingsController::class, 'deleteAccount'])->name('settings.account.destroy');
    Route::get('/settings/export', [SettingsController::class, 'exportData'])->name('settings.export');
    Route::post('/uploads', [ImageUploadController::class, 'store'])->name('uploads.store');

    // Family routes available to any authenticated user (creating a family establishes parent status)
    Route::resource('families', FamilyController::class);
    Route::post('/families/{family}/switch', [FamilyController::class, 'switchActive'])->name('families.switch');
    Route::post('/families/{family}/invite', [FamilyController::class, 'invite'])->name('families.invite');
    Route::delete('/families/{family}/members/{user}', [FamilyController::class, 'removeMember'])->name('families.members.destroy');
    Route::patch('/families/{family}/members/{user}/role', [FamilyController::class, 'updateMemberRole'])->name('families.members.role');
    Route::delete('/families/{family}/invitations/{invitation}', [FamilyController::class, 'revokeInvitation'])->name('families.invitations.destroy');

    // Kid-facing chore completion (any authenticated + verified user)
    Route::post('/chores/{chore}/complete', [ChoreCompletionController::class, 'store'])->name('chores.complete');

    // Billing routes — exempt from subscription check
    Route::middleware('require.parent')->group(function () {
        Route::get('/billing', [BillingController::class, 'index'])->name('billing');
        Route::post('/billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
        Route::post('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
        Route::post('/families/{family}/billing/transfer', [BillingTransferController::class, 'initiate'])->name('billing.transfer');
        Route::delete('/billing-transfers/{invitation}', [BillingTransferController::class, 'cancel'])->name('billing.transfer.cancel');
    });

    // Billing transfer accept — any authenticated user
    Route::get('/billing-transfers/{token}/accept', [BillingTransferController::class, 'accept'])
        ->middleware('auth')
        ->name('billing.transfer.accept');

    Route::middleware(['require.parent', 'subscribed.family'])->group(function () {
        Route::resource('spenders', SpenderController::class)->except('show');
        Route::post('/spenders/{spender}/link-child', [SpenderController::class, 'linkChild'])->name('spenders.link-child');
        Route::delete('/spenders/{spender}/linked-children/{user}', [SpenderController::class, 'unlinkChild'])->name('spenders.unlink-child');
        Route::delete('/child-invitations/{childInvitation}', [ChildInvitationController::class, 'cancel'])->name('child-invitations.cancel');
        Route::post('/spenders/{spender}/link-code', [SpenderController::class, 'generateLinkCode'])->name('spenders.generate-link-code');
        Route::delete('/spender-devices/{device}', [SpenderController::class, 'revokeDevice'])->name('spender-devices.revoke');
        Route::post('/spenders/{id}/restore', [SpenderController::class, 'restore'])->name('spenders.restore');
        Route::resource('accounts', AccountController::class)->except('show');
        Route::resource('accounts.transactions', TransactionController::class);
        Route::post('/transactions/split', [TransactionController::class, 'storeSplit'])->name('transactions.split');
        Route::resource('accounts.recurring', RecurringTransactionController::class);
        Route::post('/goals/reorder', [SavingsGoalController::class, 'reorder'])->name('goals.reorder');
        Route::get('/goals/abandoned', [SavingsGoalController::class, 'abandoned'])->name('goals.abandoned');
        Route::patch('/goals/{goal}/abandon', [SavingsGoalController::class, 'abandon'])->name('goals.abandon');
        Route::delete('/goals/{goal}/destroy-abandoned', [SavingsGoalController::class, 'destroyAbandoned'])->name('goals.destroy-abandoned');
        Route::resource('goals', SavingsGoalController::class);

        Route::resource('chores', ChoreController::class)->except('show');
        Route::get('/chores/{chore}/history', [ChoreController::class, 'history'])->name('chores.history');
        Route::get('/chores-completions-for-date', [ChoreController::class, 'completionsForDate'])->name('chores.completions-for-date');
        Route::patch('/chore-completions/{completion}/approve', [ChoreCompletionController::class, 'approve'])->name('chore-completions.approve');
        Route::patch('/chore-completions/{completion}/unapprove', [ChoreCompletionController::class, 'unapprove'])->name('chore-completions.unapprove');
        Route::patch('/chore-completions/{completion}/decline', [ChoreCompletionController::class, 'decline'])->name('chore-completions.decline');
        Route::post('/chore-completions/bulk-approve', [ChoreCompletionController::class, 'bulkApprove'])->name('chore-completions.bulk-approve');
        Route::get('/pocket-money/release', [PocketMoneyReleaseController::class, 'index'])->name('pocket-money.release');
        Route::post('/pocket-money/release', [PocketMoneyReleaseController::class, 'pay'])->name('pocket-money.pay');
        Route::post('/spenders/{spender}/pocket-money-schedule', [PocketMoneyScheduleController::class, 'store'])->name('pocket-money-schedule.store');
        Route::delete('/pocket-money-schedules/{schedule}', [PocketMoneyScheduleController::class, 'destroy'])->name('pocket-money-schedule.destroy');
    });

    // Wildcard show routes AFTER resource routes to avoid capturing /spenders/create etc.
    Route::get('/spenders/{spender}', [SpenderController::class, 'show'])->name('spenders.show');
    Route::get('/accounts/{account}', [AccountController::class, 'show'])->name('accounts.show');
    Route::get('/accounts/{account}/transfer', [TransferController::class, 'create'])->name('accounts.transfer.create');
    Route::post('/accounts/{account}/transfer', [TransferController::class, 'store'])->name('accounts.transfer');
});

Route::post('/webhooks/stripe', [WebhookController::class, 'handleWebhook']);

require __DIR__.'/auth.php';

// Local dev only: auto-verify email without needing SES
if (app()->environment('local')) {
    Route::get('/dev/verify-email', function () {
        $user = auth()->user();
        if ($user && ! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect('/dashboard');
    })->middleware('auth');
}
