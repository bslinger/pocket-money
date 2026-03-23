<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar_url' => $this->avatar_url,
            'currency_name' => $this->currency_name,
            'currency_name_plural' => $this->currency_name_plural,
            'currency_symbol' => $this->currency_symbol,
            'use_integer_amounts' => $this->use_integer_amounts,
            'billing_user_id' => $this->billing_user_id,
            'family_users' => FamilyUserResource::collection($this->whenLoaded('familyUsers')),
            'spenders' => SpenderResource::collection($this->whenLoaded('spenders')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
