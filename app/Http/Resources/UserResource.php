<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'parent_title' => $this->parent_title,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
        ];
    }
}
