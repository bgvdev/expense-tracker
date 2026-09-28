<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * The query-string filters shared by GET /expenses and GET /expenses/stats,
 * so the list and its aggregates always describe the same set of rows.
 *
 * Unknown or malformed values are a 422, not silently ignored: a typo in a
 * filter that quietly matched everything would look like correct data.
 */
class ExpenseFilterRequest extends FormRequest
{
    /** Sort keys the client may ask for, by the table column they sit under. */
    public const SORTS = ['date', 'description', 'category', 'payment', 'amount'];

    public function authorize(): bool
    {
        // Authorization is handled by the auth:sanctum middleware.
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search'               => ['nullable', 'string', 'max:255'],
            'category_ids'         => ['nullable', 'array', 'max:100'],
            'category_ids.*'       => ['integer'],
            'payment_method_ids'   => ['nullable', 'array', 'max:100'],
            'payment_method_ids.*' => ['integer'],
            // Calendar dates, inclusive at both ends. Either bound may be sent
            // alone, so the cross-field checks only apply when both are present:
            // `gte:amount_min` fails outright when amount_min is absent.
            'date_from'  => ['nullable', 'date_format:Y-m-d'],
            'date_to'    => ['nullable', 'date_format:Y-m-d', Rule::when($this->filled('date_from'), 'after_or_equal:date_from')],
            'amount_min' => ['nullable', 'numeric', 'min:0'],
            'amount_max' => ['nullable', 'numeric', 'min:0', Rule::when($this->filled('amount_min'), 'gte:amount_min')],
            'sort'       => ['nullable', 'in:'.implode(',', self::SORTS)],
            'dir'        => ['nullable', 'in:asc,desc'],
            'page'       => ['nullable', 'integer', 'min:1'],
            'per_page'   => ['nullable', 'integer'],
        ];
    }

    /**
     * Narrow a query over the user's expenses to the requested filters.
     *
     * Dates are a half-open range on spent_at, never whereDate(): that compiles
     * to `spent_at::date`, which is not sargable and cannot use
     * expense_user_id_spent_at_index (see ExpenseController::summary()).
     */
    public function applyFilters(Builder|Relation $query): Builder|Relation
    {
        $v = $this->validated();

        if (filled($v['search'] ?? null)) {
            // Escape LIKE's own wildcards so a search for "50%" matches literally.
            $term = addcslashes($v['search'], '\\%_');
            $query->where('expense.description', 'ilike', "%{$term}%");
        }
        if (! empty($v['category_ids'])) {
            $query->whereIn('expense.category_id', $v['category_ids']);
        }
        if (! empty($v['payment_method_ids'])) {
            $query->whereIn('expense.payment_method_id', $v['payment_method_ids']);
        }
        if (filled($v['date_from'] ?? null)) {
            $query->where('expense.spent_at', '>=', Carbon::createFromFormat('!Y-m-d', $v['date_from']));
        }
        if (filled($v['date_to'] ?? null)) {
            $query->where('expense.spent_at', '<', Carbon::createFromFormat('!Y-m-d', $v['date_to'])->addDay());
        }
        if (filled($v['amount_min'] ?? null)) {
            $query->where('expense.amount', '>=', $v['amount_min']);
        }
        if (filled($v['amount_max'] ?? null)) {
            $query->where('expense.amount', '<=', $v['amount_max']);
        }

        return $query;
    }

    /** Whether any filter narrows the set (sorting and paging do not). */
    public function hasFilters(): bool
    {
        $v = $this->validated();

        return filled($v['search'] ?? null)
            || ! empty($v['category_ids'])
            || ! empty($v['payment_method_ids'])
            || filled($v['date_from'] ?? null)
            || filled($v['date_to'] ?? null)
            || filled($v['amount_min'] ?? null)
            || filled($v['amount_max'] ?? null);
    }
}
