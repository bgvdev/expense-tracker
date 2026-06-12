"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipContentProps,
} from "recharts";

interface DataPoint {
  method: string;
  total: number;
}

interface Props {
  data: DataPoint[];
}

const METHOD_COLORS: Record<string, string> = {
  UPI: "#22d3ee",
  Cash: "#4ade80",
  "Credit Card": "#f472b6",
  "Debit Card": "#fb923c",
  "Net Banking": "#818cf8",
  Unspecified: "rgba(255,255,255,0.2)",
};

function getColor(method: string): string {
  return METHOD_COLORS[method] ?? "#22d3ee";
}

const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1e1e2e] border border-white/10 px-3 py-2 text-sm shadow-xl">
      <p className="text-white/50 text-xs mb-0.5">{label}</p>
      <p className="text-white font-semibold">{fmt.format(Number(payload[0].value ?? 0))}</p>
    </div>
  );
}

export default function PaymentMethodChart({ data }: Props) {
  const isEmpty = data.length === 0 || data.every((d) => d.total === 0);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <span className="material-symbols-rounded text-cyan-400 text-lg">payments</span>
        </span>
        <h2 className="text-white font-semibold text-sm">By Payment Method</h2>
      </div>

      {isEmpty ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-sm">
          No payment method data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 160)}>
          <BarChart data={data} layout="vertical" barCategoryGap="25%">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="method"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={CustomTooltip} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {data.map((entry) => (
                <Cell key={entry.method} fill={getColor(entry.method)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
