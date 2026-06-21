<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->query('per_page', 15), 100);

        $expenses = auth()->user()
            ->expenses()
            ->with(['category', 'paymentMethod'])
            ->latest('spent_at')
            ->paginate($perPage);

        return ExpenseResource::collection($expenses);
    }

    public function summary(): JsonResponse
    {
        $now = now();

        $thisMonth = auth()->user()
            ->expenses()
            ->whereYear('spent_at', $now->year)
            ->whereMonth('spent_at', $now->month)
            ->sum('amount');

        return response()->json(['this_month' => (float) $thisMonth]);
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
