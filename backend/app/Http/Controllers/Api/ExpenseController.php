<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the authenticated user's expenses.
     */
    public function index()
    {
        $expenses = auth()->user()
            ->expenses()
            ->with('category')
            ->latest('spent_at')
            ->get();

        return ExpenseResource::collection($expenses);
    }

    /**
     * Store a newly created expense for the authenticated user.
     */
    public function store(StoreExpenseRequest $request)
    {
        $expense = $request->user()
            ->expenses()
            ->create($request->validated());

        $expense->load('category');

        return new ExpenseResource($expense);
    }
}
