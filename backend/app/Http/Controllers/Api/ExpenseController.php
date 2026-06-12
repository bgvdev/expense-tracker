<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = auth()->user()
            ->expenses()
            ->with(['category', 'paymentMethod'])
            ->latest('spent_at')
            ->get();

        return ExpenseResource::collection($expenses);
    }

    public function store(StoreExpenseRequest $request)
    {
        $expense = $request->user()
            ->expenses()
            ->create($request->validated());

        $expense->load(['category', 'paymentMethod']);

        return (new ExpenseResource($expense))->response()->setStatusCode(201);
    }

    public function update(UpdateExpenseRequest $request, int $id)
    {
        $expense = auth()->user()->expenses()->findOrFail($id);
        $expense->update($request->validated());
        $expense->load(['category', 'paymentMethod']);

        return new ExpenseResource($expense);
    }

    public function destroy(int $id): JsonResponse
    {
        auth()->user()->expenses()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
