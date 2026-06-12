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
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'category_id' => [
                'required', 'integer',
                Rule::exists('category', 'id')->where(fn ($q) => $q->where('user_id', null)->orWhere('user_id', auth()->id())
                ),
            ],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_method,id'],
            'description'       => ['nullable', 'string', 'max:255'],
            'spent_at'          => ['required', 'date'],
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'amount.min'         => 'Amount must be at least 0.01.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
