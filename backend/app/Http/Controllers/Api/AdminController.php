<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController
{
    public function stats(): JsonResponse
    {
        $monthStart = now()->startOfMonth();

        return response()->json([
            'total_users'               => User::count(),
            'new_users_this_month'      => User::where('created_at', '>=', $monthStart)->count(),
            'total_expenses_count'      => DB::table('expense')->count(),
            'expenses_this_month_count' => DB::table('expense')->where('spent_at', '>=', $monthStart)->count(),
            'total_expenses_sum'        => (string) DB::table('expense')->sum('amount'),
            'expenses_this_month_sum'   => (string) DB::table('expense')->where('spent_at', '>=', $monthStart)->sum('amount'),
            'total_categories'          => DB::table('category')->count(),
        ]);
    }

    public function users(): JsonResponse
    {
        $users = User::select(
            'user.id',
            'user.name',
            'user.email',
            'user.is_admin',
            'user.created_at',
            DB::raw('COUNT(expense.id) as expense_count'),
            DB::raw('COALESCE(SUM(expense.amount), 0) as expense_sum')
        )
            ->leftJoin('expense', 'expense.user_id', '=', 'user.id')
            ->groupBy('user.id', 'user.name', 'user.email', 'user.is_admin', 'user.created_at')
            ->orderBy('user.created_at', 'desc')
            ->get()
            ->map(fn ($u) => [
                'id'            => $u->id,
                'name'          => $u->name,
                'email'         => $u->email,
                'is_admin'      => (bool) $u->is_admin,
                'created_at'    => $u->created_at,
                'expense_count' => (int) $u->expense_count,
                'expense_sum'   => (string) $u->expense_sum,
            ]);

        return response()->json($users);
    }

    public function recentActivity(): JsonResponse
    {
        $activity = DB::table('expense')
            ->join('user', 'user.id', '=', 'expense.user_id')
            ->join('category', 'category.id', '=', 'expense.category_id')
            ->select(
                'expense.id',
                'user.name as user_name',
                'expense.amount',
                'category.name as category_name',
                'category.icon as category_icon',
                'category.color as category_color',
                'expense.description',
                'expense.spent_at'
            )
            ->orderBy('expense.spent_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($activity);
    }

    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        $request->validate(['is_admin' => ['required', 'boolean']]);

        if ($request->user()->id === $id) {
            return response()->json(['message' => 'You cannot change your own admin status.'], 422);
        }

        $user           = User::findOrFail($id);
        $user->is_admin = $request->boolean('is_admin');
        $user->save();

        return response()->json([
            'id'       => $user->id,
            'is_admin' => (bool) $user->is_admin,
        ]);
    }

    // ── Global Category Management ────────────────────────────────

    public function categories(): JsonResponse
    {
        $categories = Category::whereNull('user_id')
            ->withCount('expenses')
            ->orderBy('name')
            ->get()
            ->map(fn ($cat) => [
                'id'            => $cat->id,
                'name'          => $cat->name,
                'icon'          => $cat->icon,
                'color'         => $cat->color,
                'expense_count' => $cat->expenses_count,
                'is_global'     => true,
            ]);

        return response()->json($categories);
    }

    public function storeCategory(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'user_id' => null,
            'name'    => $request->name,
            'icon'    => $request->icon,
            'color'   => $request->color,
        ]);

        return response()->json(array_merge($category->toArray(), ['is_global' => true, 'expense_count' => 0]), 201);
    }

    public function updateCategory(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::whereNull('user_id')->findOrFail($id);

        $category->update($request->only(['name', 'icon', 'color']));

        return response()->json(array_merge(
            $category->fresh()->toArray(),
            ['is_global' => true, 'expense_count' => $category->expenses()->count()]
        ));
    }

    public function destroyCategory(int $id): JsonResponse
    {
        $category     = Category::whereNull('user_id')->findOrFail($id);
        $expenseCount = $category->expenses()->count();

        if ($expenseCount > 0) {
            return response()->json([
                'message' => "Cannot delete: category is used by {$expenseCount} expense(s).",
            ], 422);
        }

        $category->delete();

        return response()->json(null, 204);
    }
}
