<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecurringTransactionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'type' => $this->type->value,
            'amount' => $this->amount,
            'description' => $this->description,
            'frequency' => $this->frequency->value,
            'frequency_config' => $this->frequency_config,
            'next_run_at' => $this->next_run_at->toISOString(),
            'is_active' => $this->is_active,
            'created_by' => $this->created_by,
            'account' => new AccountResource($this->whenLoaded('account')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
