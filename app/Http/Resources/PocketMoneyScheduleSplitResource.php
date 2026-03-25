<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PocketMoneyScheduleSplitResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pocket_money_schedule_id' => $this->pocket_money_schedule_id,
            'account_id' => $this->account_id,
            'percentage' => $this->percentage,
            'sort_order' => $this->sort_order,
            'account' => new AccountResource($this->whenLoaded('account')),
        ];
    }
}
