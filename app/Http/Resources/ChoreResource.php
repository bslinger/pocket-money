<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChoreResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'family_id' => $this->family_id,
            'name' => $this->name,
            'emoji' => $this->emoji,
            'reward_type' => $this->reward_type->value,
            'amount' => $this->amount,
            'frequency' => $this->frequency->value,
            'days_of_week' => $this->days_of_week,
            'requires_approval' => $this->requires_approval,
            'up_for_grabs' => $this->up_for_grabs,
            'is_active' => $this->is_active,
            'created_by' => $this->created_by,
            'spenders' => SpenderResource::collection($this->whenLoaded('spenders')),
            'completions' => ChoreCompletionResource::collection($this->whenLoaded('completions')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
