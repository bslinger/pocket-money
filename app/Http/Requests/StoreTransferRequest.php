<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'to_account_id' => 'required|uuid|exists:accounts,id',
            'amount'        => 'required|numeric|min:0.01',
            'description'   => 'nullable|string|max:255',
        ];
    }
}
