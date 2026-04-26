<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    /**
     * Return all categories (public — used to populate form dropdowns).
     */
    public function index()
    {
        return response()->json(Category::orderBy('name')->get());
    }
}
