"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";

interface DataPoint {
  day: string;
  total: number;
}

interface Props {
  data: DataPoint[];
  monthLabel: string;
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
      <p className="text-white/50 text-xs mb-0.5">Day {label}</p>
      <p className="text-white font-semibold">{fmt.format(Number(payload[0].value ?? 0))}</p>
    </div>
  );
}

export default function DailyLineChart({ data, monthLabel }: Props) {
  const isEmpty = data.every((d) => d.total === 0);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <span className="material-symbols-rounded text-purple-400 text-lg">show_chart</span>
        </span>
        <h2 className="text-white font-semibold text-sm">Daily Spending</h2>
        <span className="ml-auto text-white/30 text-xs">{monthLabel}</span>
      </div>

      {isEmpty ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-sm">
          No spending this month yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis hide />
            <Tooltip content={CustomTooltip} cursor={{ stroke: "rgba(168,85,247,0.3)" }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#dailyGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#a855f7" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
