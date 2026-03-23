<?php

namespace App\Http\Resources;

use App\Http\Controllers\ImageUploadController;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SavingsGoalResource extends JsonResource
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
            'name' => $this->name,
            'target_amount' => $this->target_amount,
            'allocated_amount' => $this->allocated_amount ?? '0.00',
            'sort_order' => $this->sort_order,
            'image_key' => $this->image_key,
            'image_url' => $this->image_key ? ImageUploadController::url($this->image_key) : null,
            'target_date' => $this->target_date?->toDateString(),
            'is_completed' => $this->is_completed,
            'completed_at' => $this->completed_at?->toISOString(),
            'abandoned_at' => $this->abandoned_at?->toISOString(),
            'abandoned_allocated_amount' => $this->abandoned_allocated_amount,
            'match_percentage' => $this->match_percentage,
            'spender' => new SpenderResource($this->whenLoaded('spender')),
            'account' => new AccountResource($this->whenLoaded('account')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
