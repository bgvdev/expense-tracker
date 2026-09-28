<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseFilterRequest;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    /**
     * One page of the user's expenses, filtered and sorted server-side.
     *
     * meta carries two extra figures the client cannot derive from one page:
     * total_amount (the sum over every matching row) and user_total (how many
     * expenses the user has at all, so the UI can tell "no expenses yet" from
     * "nothing matches these filters").
     */
    public function index(ExpenseFilterRequest $request)
    {
        // Clamp both ends: per_page=0 divides by zero computing the last page and
        // a negative value emits a negative LIMIT — both surface as a 500.
        $perPage = max(1, min((int) $request->query('per_page', 15), 100));

        $filtered = $request->applyFilters($this->ownExpenses());

        $totalAmount = (clone $filtered)->sum('expense.amount');

        $page = $this->applySort($filtered, $request)
            ->select('expense.*')
            ->with(['category', 'paymentMethod'])
            ->paginate($perPage);

        return ExpenseResource::collection($page)->additional(['meta' => [
            'total_amount' => round((float) $totalAmount, 2),
            'user_total'   => $request->hasFilters() ? $this->ownExpenses()->count() : $page->total(),
        ]]);
    }

    /**
     * Aggregates over the filtered set, for charts and breakdowns. Series only
     * contain buckets that have spending; the client fills the gaps, because
     * which gaps to show (last six months, this month's days) is presentation.
     *
     * Buckets use spent_at's stored calendar date. The client submits a plain
     * Y-m-d, stored as midnight UTC, so no timezone conversion applies here.
     */
    public function stats(ExpenseFilterRequest $request): JsonResponse
    {
        $filtered = fn (): Builder => $request->applyFilters($this->ownExpenses());

        $totals = $filtered()
            ->selectRaw('count(*) as count, coalesce(sum(expense.amount), 0) as total')
            ->selectRaw("to_char(min(expense.spent_at), 'YYYY-MM-DD') as first_date")
            ->selectRaw("to_char(max(expense.spent_at), 'YYYY-MM-DD') as last_date")
            ->toBase()
            ->first();

        $byCategory = $filtered()
            ->join('category', 'category.id', '=', 'expense.category_id')
            ->groupBy('category.id', 'category.name', 'category.icon', 'category.color')
            ->selectRaw('category.id, category.name, category.icon, category.color')
            ->selectRaw('count(*) as count, sum(expense.amount) as total')
            ->orderByDesc('total')
            ->orderBy('category.name')
            ->toBase()
            ->get()
            ->map(fn ($row) => [
                'category' => ['id' => $row->id, 'name' => $row->name, 'icon' => $row->icon, 'color' => $row->color],
                'count'    => (int) $row->count,
                'total'    => round((float) $row->total, 2),
            ]);

        $byPaymentMethod = $filtered()
            ->leftJoin('payment_method', 'payment_method.id', '=', 'expense.payment_method_id')
            ->groupBy('payment_method.id', 'payment_method.name')
            ->selectRaw('payment_method.id, payment_method.name, sum(expense.amount) as total')
            // Expenses without a method last, whatever their total.
            ->orderByRaw('payment_method.id is null')
            ->orderByDesc('total')
            ->toBase()
            ->get()
            ->map(fn ($row) => [
                'id'    => $row->id,
                'name'  => $row->name,
                'total' => round((float) $row->total, 2),
            ]);

        $series = fn (string $format, string $key) => $filtered()
            ->selectRaw("to_char(expense.spent_at, '{$format}') as bucket, sum(expense.amount) as total")
            ->groupByRaw("to_char(expense.spent_at, '{$format}')")
            ->orderBy('bucket')
            ->toBase()
            ->get()
            ->map(fn ($row) => [$key => $row->bucket, 'total' => round((float) $row->total, 2)]);

        $highest = $filtered()
            ->with(['category', 'paymentMethod'])
            ->orderByDesc('expense.amount')
            ->orderByDesc('expense.spent_at')
            ->first();

        // Most-used is by count; ties go to the larger spend, then the name.
        $mostUsed = $byCategory->sortBy([['count', 'desc'], ['total', 'desc']])->first();

        return response()->json([
            'count'              => (int) $totals->count,
            'total'              => round((float) $totals->total, 2),
            'first_date'         => $totals->first_date,
            'last_date'          => $totals->last_date,
            'highest'            => $highest ? new ExpenseResource($highest) : null,
            'most_used_category' => $mostUsed ? ['category' => $mostUsed['category'], 'count' => $mostUsed['count']] : null,
            'by_category'        => $byCategory->values(),
            'by_payment_method'  => $byPaymentMethod->values(),
            'daily'              => $series('YYYY-MM-DD', 'date')->values(),
            'monthly'            => $series('YYYY-MM', 'month')->values(),
        ]);
    }

    public function summary(): JsonResponse
    {
        // A half-open range, not whereYear()+whereMonth(): those compile to
        // `extract(year from spent_at) = ?` on Postgres, which is not sargable,
        // so the planner could not use expense_user_id_spent_at_index and fell
        // back to scanning every one of the user's rows.
        $start = now()->startOfMonth();
        $end   = $start->copy()->addMonth();

        $thisMonth = auth()->user()
            ->expenses()
            ->where('spent_at', '>=', $start)
            ->where('spent_at', '<', $end)
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

    /** The authenticated user's expenses, with columns qualified for joins. */
    private function ownExpenses(): Builder
    {
        return Expense::query()->where('expense.user_id', auth()->id());
    }

    /**
     * Order by the requested column. Text columns sort case-insensitively on
     * what the table renders, with blanks as empty strings; every sort breaks
     * ties newest-first so paging never shows a row twice or skips one.
     */
    private function applySort(Builder $query, ExpenseFilterRequest $request): Builder
    {
        $sort = $request->validated('sort') ?? 'date';
        // Validated to exactly asc|desc, so it is safe to interpolate below.
        $dir = $request->validated('dir') ?? (in_array($sort, ['date', 'amount'], true) ? 'desc' : 'asc');

        match ($sort) {
            'date'        => $query->orderBy('expense.spent_at', $dir),
            'amount'      => $query->orderBy('expense.amount', $dir),
            'description' => $query->orderByRaw("lower(coalesce(expense.description, '')) {$dir}"),
            'category'    => $query
                ->join('category', 'category.id', '=', 'expense.category_id')
                ->orderByRaw("lower(category.name) {$dir}"),
            'payment' => $query
                ->leftJoin('payment_method', 'payment_method.id', '=', 'expense.payment_method_id')
                ->orderByRaw("lower(coalesce(payment_method.name, '')) {$dir}"),
        };

        return $query->orderByDesc('expense.spent_at')->orderByDesc('expense.id');
    }
}
