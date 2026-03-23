<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChoreRewardResource extends JsonResource
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
            'description' => $this->description,
            'payout_date' => $this->payout_date?->toDateString(),
            'is_paid' => $this->is_paid,
            'paid_at' => $this->paid_at?->toISOString(),
            'transaction_id' => $this->transaction_id,
            'account' => new AccountResource($this->whenLoaded('account')),
            'chores' => ChoreResource::collection($this->whenLoaded('chores')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
