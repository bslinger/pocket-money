<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                 => 'required|string|max:255',
            'currency_name'        => 'nullable|string|max:50',
            'currency_name_plural' => 'nullable|string|max:50',
            'currency_symbol'      => 'nullable|string|max:10',
            'use_integer_amounts'  => 'nullable|boolean',
        ];
    }
}
