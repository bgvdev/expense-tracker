<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by the auth:sanctum middleware.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // max mirrors the decimal(10,2) column — without it, larger values
            // reach Postgres and fail as a numeric overflow (500) instead of 422.
            'amount'      => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'category_id' => [
                'required', 'integer',
                Rule::exists('category', 'id')->where(fn ($q) => $q->where('user_id', null)->orWhere('user_id', auth()->id())
                ),
            ],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_method,id'],
            'description'       => ['nullable', 'string', 'max:255'],
            'spent_at'          => ['required', 'date', 'before_or_equal:today'],
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'amount.min'               => 'Amount must be at least 0.01.',
            'amount.max'               => 'Amount may not be greater than 99,999,999.99.',
            'category_id.exists'       => 'The selected category does not exist.',
            'spent_at.before_or_equal' => 'The date cannot be in the future.',
        ];
    }
}
