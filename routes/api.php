<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChildDashboardController;
use App\Http\Controllers\Api\V1\ChildDeviceTokenController;
use App\Http\Controllers\Api\V1\ChoreCompletionController;
use App\Http\Controllers\Api\V1\ChoreController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeviceTokenController;
use App\Http\Controllers\Api\V1\FamilyController;
use App\Http\Controllers\Api\V1\FeedbackController;
use App\Http\Controllers\Api\V1\PocketMoneyController;
use App\Http\Controllers\Api\V1\RecurringTransactionController;
use App\Http\Controllers\Api\V1\SavingsGoalController;
use App\Http\Controllers\Api\V1\SpenderController;
use App\Http\Controllers\Api\V1\SpenderLinkCodeController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\TransferController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------------------
// Public (unauthenticated)
// ---------------------------------------------------------------------------
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/spender-devices/claim', [SpenderLinkCodeController::class, 'claim']);

// ---------------------------------------------------------------------------
// Authenticated (Sanctum token auth)
// ---------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function (): void {

    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::put('/auth/user', [AuthController::class, 'updateProfile']);
    Route::delete('/auth/user', [AuthController::class, 'deleteAccount']);
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

    // Pocket Money
    Route::get('/pocket-money/release', [PocketMoneyController::class, 'release']);
    Route::post('/pocket-money/release', [PocketMoneyController::class, 'pay']);
    Route::post('/spenders/{spender}/pocket-money-schedule', [PocketMoneyController::class, 'storeSchedule']);
    Route::delete('/pocket-money-schedules/{schedule}', [PocketMoneyController::class, 'destroySchedule']);

    // Device Tokens (push notifications)
    Route::post('/device-tokens', [DeviceTokenController::class, 'store']);
    Route::delete('/device-tokens', [DeviceTokenController::class, 'destroy']);

    // Spender Link Codes & Devices (parent manages child device linking)
    Route::post('/spenders/{spender}/link-code', [SpenderLinkCodeController::class, 'store']);
    Route::get('/spenders/{spender}/devices', [SpenderLinkCodeController::class, 'devices']);
    Route::delete('/spender-devices/{device}', [SpenderLinkCodeController::class, 'revokeDevice']);

    // Broadcasting auth (mobile parent devices)
    Route::post('/broadcasting/auth', function (Request $request) {
        return Broadcast::auth($request);
    });

    // Feedback
    Route::post('/feedback', [FeedbackController::class, 'store']);
});

// ---------------------------------------------------------------------------
// Child device auth (spender device token, no user account needed)
// ---------------------------------------------------------------------------
Route::middleware('auth.spender_device')->group(function (): void {
    Route::get('/child/dashboard', [ChildDashboardController::class, 'index']);
    Route::post('/child/chores/{chore}/complete', [ChildDashboardController::class, 'completeChore']);
    Route::get('/child/accounts/{account}/transactions', [ChildDashboardController::class, 'transactions']);
    Route::post('/child/device-tokens', [ChildDeviceTokenController::class, 'store']);
    Route::delete('/child/device-tokens', [ChildDeviceTokenController::class, 'destroy']);

    // Broadcasting auth (child devices)
    Route::post('/child/broadcasting/auth', function (Request $request) {
        $spender = $request->attributes->get('spender');
        $channelName = str_replace('private-', '', $request->input('channel_name', ''));

        // Child devices can only auth to their own spender channel
        if ($channelName === 'spender.'.$spender->id) {
            $socketId = $request->input('socket_id');
            $secret = config('broadcasting.connections.reverb.app_secret');
            $key = config('broadcasting.connections.reverb.app_key');
            $signature = hash_hmac('sha256', $socketId.':'.$request->input('channel_name'), $secret);

            return response()->json(['auth' => $key.':'.$signature]);
        }

        abort(403);
    });
});
