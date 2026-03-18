<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecurringTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'             => 'required|in:credit,debit',
            'amount'           => 'required|numeric|min:0.01',
            'description'      => 'nullable|string|max:255',
            'frequency'        => 'required|in:daily,weekly,fortnightly,monthly,yearly',
            'frequency_config' => 'nullable|array',
            'next_run_at'      => 'required|date',
        ];
    }
}
