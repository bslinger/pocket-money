<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'family_id'        => ['required', 'uuid', 'exists:families,id'],
            'name'             => ['required', 'string', 'max:255'],
            'emoji'            => ['nullable', 'string', 'max:10'],
            'reward_type'      => ['required', 'in:earns,responsibility,no_reward'],
            'amount'           => ['required_if:reward_type,earns', 'nullable', 'numeric', 'min:0.01'],
            'frequency'        => ['required', 'in:daily,weekly,monthly,one_off'],
            'days_of_week'     => ['nullable', 'array'],
            'days_of_week.*'   => ['integer', 'min:0', 'max:6'],
            'requires_approval'=> ['boolean'],
            'up_for_grabs'     => ['boolean'],
            'is_active'        => ['boolean'],
            'spender_ids'      => ['required', 'array', 'min:1'],
            'spender_ids.*'    => ['uuid', 'exists:spenders,id'],
        ];
    }
}
