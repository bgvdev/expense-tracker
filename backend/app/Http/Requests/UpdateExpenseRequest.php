<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'category_id' => ['sometimes', 'integer', 'exists:category,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'spent_at'    => ['sometimes', 'date'],
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
