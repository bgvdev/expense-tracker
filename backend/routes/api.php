<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes are stateless and return JSON responses.
| Prefix: /api
*/

Route::get('/health', function () {
    return response()->json([
        'status'  => 'ok',
        'service' => 'Expense Tracker API',
        'version' => '0.1.0',
    ]);
});
