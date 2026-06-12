<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'amount'      => $this->amount,
            'description' => $this->description,
            'spent_at'    => $this->spent_at?->toIso8601String(),
            'category'    => $this->whenLoaded('category', fn () => [
                'id'    => $this->category->id,
                'name'  => $this->category->name,
                'icon'  => $this->category->icon,
                'color' => $this->category->color,
            ]),
            'payment_method' => $this->whenLoaded('paymentMethod', fn () => $this->paymentMethod
                ? ['id' => $this->paymentMethod->id, 'name' => $this->paymentMethod->name, 'slug' => $this->paymentMethod->slug]
                : null
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
