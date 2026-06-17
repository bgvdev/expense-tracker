<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminController
{
    public function users(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'is_admin', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users'          => User::count(),
            'total_expenses_count' => DB::table('expense')->count(),
            'total_expenses_sum'   => (string) DB::table('expense')->sum('amount'),
            'total_categories'     => DB::table('category')->count(),
        ]);
    }
}
