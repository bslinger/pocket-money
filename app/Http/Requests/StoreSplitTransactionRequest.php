<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSplitTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'description' => 'nullable|string|max:255',
            'occurred_at' => 'required|date',
            'splits' => 'required|array|min:2',
            'splits.*.account_id' => 'required|uuid|exists:accounts,id',
            'splits.*.amount' => 'required|numeric|min:0.01',
        ];
    }
}
