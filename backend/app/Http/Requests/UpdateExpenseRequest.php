<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'      => ['sometimes', 'numeric', 'min:0.01'],
            'category_id' => [
                'sometimes', 'integer',
                Rule::exists('category', 'id')->where(fn ($q) => $q->where('user_id', null)->orWhere('user_id', auth()->id())
                ),
            ],
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_method,id'],
            'description'       => ['nullable', 'string', 'max:255'],
            'spent_at'          => ['sometimes', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.min'         => 'Amount must be at least 0.01.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
