"use client";

import { useState } from "react";
import type { DateRange } from "@/hooks/useReportsData";

export type ReportDatePreset = "all" | "month" | "last_month" | "3months" | "6months" | "year" | "custom";

const PRESETS: { value: ReportDatePreset; label: string }[] = [
  { value: "all",        label: "All time" },
  { value: "month",      label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "3months",    label: "Last 3 months" },
  { value: "6months",    label: "Last 6 months" },
  { value: "year",       label: "This year" },
  { value: "custom",     label: "Custom…" },
];

function rangeForPreset(preset: ReportDatePreset, customFrom: string | null, customTo: string | null): DateRange {
  const now = new Date();

  if (preset === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  if (preset === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  if (preset === "3months") {
    return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now };
  }
  if (preset === "6months") {
    return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: now };
  }
  if (preset === "year") {
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
  if (preset === "custom") {
    return {
      from: customFrom ? new Date(customFrom + "T00:00:00") : null,
      to: customTo ? new Date(customTo + "T23:59:59") : null,
    };
  }
  return { from: null, to: null };
}

interface Props {
  onChange: (range: DateRange) => void;
}

export default function ReportDateFilter({ onChange }: Props) {
  const [preset, setPreset] = useState<ReportDatePreset>("all");
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);

  const select = (value: ReportDatePreset) => {
    setPreset(value);
    onChange(rangeForPreset(value, customFrom, customTo));
  };

  const updateCustom = (from: string | null, to: string | null) => {
    setCustomFrom(from);
    setCustomTo(to);
    onChange(rangeForPreset("custom", from, to));
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 mb-5">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => select(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              preset === value
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="mt-3 flex gap-3 max-w-sm">
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">From</label>
            <input
              type="date"
              value={customFrom ?? ""}
              onChange={(e) => updateCustom(e.target.value || null, customTo)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">To</label>
            <input
              type="date"
              value={customTo ?? ""}
              onChange={(e) => updateCustom(customFrom, e.target.value || null)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
