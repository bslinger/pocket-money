<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpenderResource extends JsonResource
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
            'avatar_url' => $this->avatar_url,
            'color' => $this->color,
            'currency_name' => $this->currency_name,
            'currency_name_plural' => $this->currency_name_plural,
            'currency_symbol' => $this->currency_symbol,
            'use_integer_amounts' => $this->use_integer_amounts,
            'deleted_at' => $this->deleted_at?->toISOString(),
            'accounts' => AccountResource::collection($this->whenLoaded('accounts')),
            'savings_goals' => SavingsGoalResource::collection($this->whenLoaded('savingsGoals')),
            'chores' => ChoreResource::collection($this->whenLoaded('chores')),
            'users' => UserResource::collection($this->whenLoaded('users')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
