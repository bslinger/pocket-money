<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSavingsGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0.01',
            'account_id' => 'nullable|uuid|exists:accounts,id',
            'image_key' => 'nullable|string|max:500',
            'target_date' => 'nullable|date',
        ];
    }
}
