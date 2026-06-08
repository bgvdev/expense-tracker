<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $userId = auth()->id();

        $categories = Category::accessibleBy($userId)
            ->orderByRaw('user_id IS NOT NULL, name')
            ->get()
            ->map(fn ($cat) => array_merge($cat->toArray(), [
                'is_global' => $cat->user_id === null,
            ]));

        return response()->json($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $slug = Str::slug($request->name);
        $base = $slug;
        $i = 1;

        // Ensure slug is unique among this user's categories + global ones
        while (Category::accessibleBy(auth()->id())->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        $category = Category::create([
            'user_id' => auth()->id(),
            'name'    => $request->name,
            'slug'    => $slug,
            'icon'    => $request->icon,
            'color'   => $request->color,
        ]);

        return response()->json(array_merge($category->toArray(), ['is_global' => false]), 201);
    }

    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        $category->update($request->only(['name', 'icon', 'color']));

        return response()->json(array_merge($category->fresh()->toArray(), ['is_global' => false]));
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        $expenseCount = $category->expenses()->where('user_id', auth()->id())->count();
        if ($expenseCount > 0) {
            return response()->json([
                'message' => "Cannot delete: category is used by {$expenseCount} expense(s).",
            ], 422);
        }

        $category->delete();

        return response()->json(null, 204);
    }
}
