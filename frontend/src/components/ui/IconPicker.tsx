"use client";

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
    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
      <div className="grid grid-cols-8 gap-1">
        {ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            title={icon}
            onClick={() => onChange(icon)}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
              value === icon
                ? "bg-indigo-500/30 border-2 border-indigo-500 text-indigo-300"
                : "text-white/50 hover:bg-white/10 hover:text-white/80 border-2 border-transparent"
            }`}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
