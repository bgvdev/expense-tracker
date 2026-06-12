"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";

interface DataPoint {
  month: string;
  total: number;
}

interface Props {
  data: DataPoint[];
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

export default function MonthlyBarChart({ data }: Props) {
  const isEmpty = data.every((d) => d.total === 0);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <span className="material-symbols-rounded text-indigo-400 text-lg">calendar_month</span>
        </span>
        <h2 className="text-white font-semibold text-sm">Monthly Spending</h2>
        <span className="ml-auto text-white/30 text-xs">Last 6 months</span>
      </div>

      {isEmpty ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-sm">
          No spending data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="30%">
            <XAxis
              dataKey="month"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={CustomTooltip} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
