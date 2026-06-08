<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:50'],
            'icon'  => ['required', 'string', 'max:100'],
            'color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'color.regex' => 'Color must be a valid hex code (e.g. #FF5733).',
        ];
    }
}
