<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChoreCompletionController;
use App\Http\Controllers\Api\V1\ChoreController;
use App\Http\Controllers\Api\V1\ChoreRewardController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeviceTokenController;
use App\Http\Controllers\Api\V1\FamilyController;
use App\Http\Controllers\Api\V1\PocketMoneyController;
use App\Http\Controllers\Api\V1\RecurringTransactionController;
use App\Http\Controllers\Api\V1\SavingsGoalController;
use App\Http\Controllers\Api\V1\SpenderController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\TransferController;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------------------
// Public (unauthenticated)
// ---------------------------------------------------------------------------
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// ---------------------------------------------------------------------------
// Authenticated (Sanctum token auth)
// ---------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function (): void {

    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Families
    Route::get('/families', [FamilyController::class, 'index']);
    Route::post('/families', [FamilyController::class, 'store']);
    Route::get('/families/{family}', [FamilyController::class, 'show']);
    Route::put('/families/{family}', [FamilyController::class, 'update']);
    Route::post('/families/{family}/switch', [FamilyController::class, 'switchActive']);

    // Spenders
    Route::get('/spenders', [SpenderController::class, 'index']);
    Route::post('/spenders', [SpenderController::class, 'store']);
    Route::get('/spenders/{spender}', [SpenderController::class, 'show']);
    Route::put('/spenders/{spender}', [SpenderController::class, 'update']);
    Route::delete('/spenders/{spender}', [SpenderController::class, 'destroy']);

    // Accounts
    Route::get('/accounts/{account}', [AccountController::class, 'show']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{account}', [AccountController::class, 'update']);
    Route::delete('/accounts/{account}', [AccountController::class, 'destroy']);

    // Transactions
    Route::get('/accounts/{account}/transactions', [TransactionController::class, 'index']);
    Route::post('/accounts/{account}/transactions', [TransactionController::class, 'store']);
    Route::put('/accounts/{account}/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/accounts/{account}/transactions/{transaction}', [TransactionController::class, 'destroy']);

    // Transfers
    Route::post('/accounts/{account}/transfer', [TransferController::class, 'store']);

    // Recurring Transactions
    Route::get('/accounts/{account}/recurring', [RecurringTransactionController::class, 'index']);
    Route::post('/accounts/{account}/recurring', [RecurringTransactionController::class, 'store']);
    Route::put('/accounts/{account}/recurring/{recurring}', [RecurringTransactionController::class, 'update']);
    Route::delete('/accounts/{account}/recurring/{recurring}', [RecurringTransactionController::class, 'destroy']);

    // Savings Goals
    Route::get('/goals', [SavingsGoalController::class, 'index']);
    Route::post('/goals', [SavingsGoalController::class, 'store']);
    Route::get('/goals/{goal}', [SavingsGoalController::class, 'show']);
    Route::put('/goals/{goal}', [SavingsGoalController::class, 'update']);
    Route::delete('/goals/{goal}', [SavingsGoalController::class, 'destroy']);
    Route::post('/goals/reorder', [SavingsGoalController::class, 'reorder']);
    Route::patch('/goals/{goal}/abandon', [SavingsGoalController::class, 'abandon']);

    // Chores
    Route::get('/chores', [ChoreController::class, 'index']);
    Route::post('/chores', [ChoreController::class, 'store']);
    Route::get('/chores/{chore}', [ChoreController::class, 'show']);
    Route::put('/chores/{chore}', [ChoreController::class, 'update']);
    Route::delete('/chores/{chore}', [ChoreController::class, 'destroy']);
    Route::get('/chores/{chore}/history', [ChoreController::class, 'history']);

    // Chore Completions
    Route::post('/chores/{chore}/complete', [ChoreCompletionController::class, 'store']);
    Route::patch('/chore-completions/{completion}/approve', [ChoreCompletionController::class, 'approve']);
    Route::patch('/chore-completions/{completion}/decline', [ChoreCompletionController::class, 'decline']);
    Route::post('/chore-completions/bulk-approve', [ChoreCompletionController::class, 'bulkApprove']);

    // Chore Rewards
    Route::post('/spenders/{spender}/chore-rewards', [ChoreRewardController::class, 'store']);
    Route::delete('/chore-rewards/{choreReward}', [ChoreRewardController::class, 'destroy']);

    // Pocket Money
    Route::get('/pocket-money/release', [PocketMoneyController::class, 'release']);
    Route::post('/pocket-money/release', [PocketMoneyController::class, 'pay']);
    Route::post('/spenders/{spender}/pocket-money-schedule', [PocketMoneyController::class, 'storeSchedule']);
    Route::delete('/pocket-money-schedules/{schedule}', [PocketMoneyController::class, 'destroySchedule']);

    // Device Tokens (push notifications)
    Route::post('/device-tokens', [DeviceTokenController::class, 'store']);
    Route::delete('/device-tokens', [DeviceTokenController::class, 'destroy']);
});
