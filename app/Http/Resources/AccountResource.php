<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'spender_id' => $this->spender_id,
            'name' => $this->name,
            'balance' => $this->balance,
            'currency_name' => $this->currency_name,
            'currency_name_plural' => $this->currency_name_plural,
            'currency_symbol' => $this->currency_symbol,
            'use_integer_amounts' => $this->use_integer_amounts,
            'spender' => new SpenderResource($this->whenLoaded('spender')),
            'transactions' => TransactionResource::collection($this->whenLoaded('transactions')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
