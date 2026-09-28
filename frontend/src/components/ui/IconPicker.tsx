"use client";

import { cn } from "@/lib/cn";
import Icon from "./Icon";

const ICONS = [
  // Finance
  "account_balance_wallet", "savings", "payments", "credit_card", "currency_rupee",
  "trending_up", "receipt_long", "price_check", "monetization_on",
  // Food & Drink
  "fastfood", "local_cafe", "restaurant", "lunch_dining", "bakery_dining",
  "local_pizza", "grocery", "wine_bar", "coffee",
  // Transport
  "directions_car", "directions_bus", "flight", "train", "two_wheeler",
  "local_taxi", "directions_bike", "electric_moped",
  // Shopping
  "shopping_cart", "shopping_bag", "storefront", "redeem", "card_giftcard", "sell",
  // Home & Utilities
  "home", "house", "bed", "chair", "electrical_services",
  "water_drop", "cleaning_services", "construction",
  // Health
  "medical_services", "medication", "local_hospital", "spa", "self_improvement", "fitness_center",
  // Entertainment
  "movie", "sports_esports", "music_note", "theater_comedy", "sports_soccer", "headphones",
  // Education
  "school", "book", "auto_stories", "science", "laptop",
  // Social
  "groups", "celebration", "card_travel", "luggage", "pets",
  // Other
  "help_outline", "category", "label", "star", "work", "business_center",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-1.5">
      <div role="radiogroup" aria-label="Icon" className="grid grid-cols-8 gap-1">
        {ICONS.map((icon) => {
          const selected = value === icon;
          return (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={icon}
              title={icon}
              onClick={() => onChange(icon)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-subtle hover:text-foreground",
              )}
            >
              <Icon name={icon} size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
