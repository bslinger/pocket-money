<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PocketMoneyScheduleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'spender_id' => $this->spender_id,
            'account_id' => $this->account_id,
            'amount' => $this->amount,
            'frequency' => $this->frequency,
            'day_of_week' => $this->day_of_week,
            'day_of_month' => $this->day_of_month,
            'is_active' => $this->is_active,
            'next_run_at' => $this->next_run_at?->toISOString(),
            'account' => new AccountResource($this->whenLoaded('account')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
