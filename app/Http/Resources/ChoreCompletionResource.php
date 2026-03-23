<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChoreCompletionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chore_id' => $this->chore_id,
            'spender_id' => $this->spender_id,
            'status' => $this->status->value,
            'completed_at' => $this->completed_at->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'reviewed_by' => $this->reviewed_by,
            'note' => $this->note,
            'transaction_id' => $this->transaction_id,
            'chore' => new ChoreResource($this->whenLoaded('chore')),
            'spender' => new SpenderResource($this->whenLoaded('spender')),
            'transaction' => new TransactionResource($this->whenLoaded('transaction')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
