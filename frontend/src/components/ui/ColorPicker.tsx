"use client";

const COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#06B6D4", // cyan
  "#FF5733", // red-orange
  "#808080", // gray
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          onClick={() => onChange(color)}
          className="w-8 h-8 rounded-full transition-all"
          style={{
            backgroundColor: color,
            boxShadow: value === color ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px ${color}` : "none",
            transform: value === color ? "scale(1.15)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}
