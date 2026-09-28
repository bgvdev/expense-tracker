"use client";

import { useState } from "react";
import type { DateRange } from "@/hooks/useReportsData";
import Chip from "@/components/ui/Chip";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";

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
    <div className="mb-6">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
        {PRESETS.map(({ value, label }) => (
          <Chip key={value} selected={preset === value} onClick={() => select(value)}>
            {label}
          </Chip>
        ))}
      </div>
      {preset === "custom" && (
        <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
          <Field label="From" htmlFor="report-from">
            <Input
              id="report-from"
              type="date"
              size="sm"
              value={customFrom ?? ""}
              onChange={(e) => updateCustom(e.target.value || null, customTo)}
            />
          </Field>
          <Field label="To" htmlFor="report-to">
            <Input
              id="report-to"
              type="date"
              size="sm"
              value={customTo ?? ""}
              onChange={(e) => updateCustom(customFrom, e.target.value || null)}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
