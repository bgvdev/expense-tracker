<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'  => ['sometimes', 'string', 'max:50'],
            'icon'  => ['sometimes', 'string', 'max:100'],
            'color' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'color.regex' => 'Color must be a valid hex code (e.g. #FF5733).',
        ];
    }
}
