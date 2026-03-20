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
            'name'            => 'required|string|max:255',
            'avatar_url'      => 'nullable|url|max:255',
            'currency_name'   => 'nullable|string|max:50',
            'currency_symbol' => 'nullable|string|max:10',
        ];
    }
}
