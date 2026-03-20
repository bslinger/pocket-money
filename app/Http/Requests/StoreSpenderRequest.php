<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSpenderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'family_id'       => 'required|uuid|exists:families,id',
            'name'            => 'required|string|max:255',
            'avatar_key'      => 'nullable|string|max:500',
            'color'           => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'currency_name'        => 'nullable|string|max:50',
            'currency_name_plural' => 'nullable|string|max:50',
            'currency_symbol'      => 'nullable|string|max:10',
            'use_integer_amounts'  => 'nullable|boolean',
        ];
    }
}
