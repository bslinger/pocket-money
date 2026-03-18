<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'        => 'required|in:credit,debit',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'image_key'   => 'nullable|string|max:500',
            'occurred_at' => 'required|date',
        ];
    }
}
