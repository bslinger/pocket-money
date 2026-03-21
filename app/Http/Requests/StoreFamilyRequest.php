<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFamilyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'              => 'required|string|max:255',
            'avatar_url'        => 'nullable|url|max:255',
            'currency_name'        => 'nullable|string|max:50',
            'currency_name_plural' => 'nullable|string|max:50',
            'currency_symbol'      => 'nullable|string|max:10',
            'use_integer_amounts'  => 'nullable|boolean',
            'spenders'          => 'nullable|array|max:20',
            'spenders.*.name'    => 'required_with:spenders|string|max:255',
            'spenders.*.color'   => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'spenders.*.balance' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
