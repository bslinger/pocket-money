<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
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
            'image_key' => $this->image_key,
            'image_url' => $this->imageUrl(),
            'transfer_group_id' => $this->transfer_group_id,
            'occurred_at' => $this->occurred_at->toISOString(),
            'created_by' => $this->created_by,
            'account' => new AccountResource($this->whenLoaded('account')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
