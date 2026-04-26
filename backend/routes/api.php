<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes are stateless and return JSON responses.
| Prefix: /api
*/

// Public routes
Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Public: category list (used to populate the expense form dropdown)
Route::get('categories', [CategoryController::class, 'index']);

// Auth — public (no token required)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Protected routes (require a valid Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    // Auth — protected
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',      [AuthController::class, 'me']);
    });

    // Expenses
    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store']);
});
