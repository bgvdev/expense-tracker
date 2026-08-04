<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\PaymentMethodController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes are stateless and return JSON responses.
| Prefix: /api
*/

// Public routes
//
// Render gates traffic on this endpoint, so it must actually verify the database:
// a static 200 could not distinguish a healthy deploy from one whose migrations
// failed, which defeated the point of the health gate.
Route::get('/health', function () {
    try {
        DB::select('select 1');
    } catch (Throwable $e) {
        report($e);

        return response()->json(['status' => 'error', 'database' => 'unavailable'], 503);
    }

    return response()->json(['status' => 'ok', 'database' => 'ok']);
});

// Auth — public (rate-limited to 10 requests/minute per IP)
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes (require a valid Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    // Auth — protected
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::patch('profile', [AuthController::class, 'updateProfile']);
        Route::patch('password', [AuthController::class, 'updatePassword']);
    });

    // Categories (user's own + global)
    Route::apiResource('categories', CategoryController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Payment methods (read-only reference data)
    Route::get('payment-methods', [PaymentMethodController::class, 'index']);

    // Expenses
    Route::get('expenses/summary', [ExpenseController::class, 'summary']);
    Route::apiResource('expenses', ExpenseController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Admin (requires is_admin = true)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('stats', [AdminController::class, 'stats']);
        Route::get('activity', [AdminController::class, 'recentActivity']);

        Route::get('users', [AdminController::class, 'users']);
        Route::patch('users/{id}/role', [AdminController::class, 'updateUserRole']);

        Route::get('categories', [AdminController::class, 'categories']);
        Route::post('categories', [AdminController::class, 'storeCategory']);
        Route::patch('categories/{id}', [AdminController::class, 'updateCategory']);
        Route::delete('categories/{id}', [AdminController::class, 'destroyCategory']);
    });
});
