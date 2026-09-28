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
import ChartCard, { ChartTooltip, chartColors, tickStyle } from "./ChartCard";
import { formatCurrency } from "@/lib/format";

interface DataPoint {
  day: string;
  total: number;
}

interface Props {
  data: DataPoint[];
  monthLabel: string;
}

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const isPlainDay = /^\d+$/.test(String(label));
  return (
    <ChartTooltip
      label={isPlainDay ? `Day ${label}` : label}
      value={formatCurrency(Number(payload[0].value ?? 0), { decimals: false })}
    />
  );
}

export default function DailyLineChart({ data, monthLabel }: Props) {
  const isEmpty = data.every((d) => d.total === 0);

  return (
    <ChartCard title="Daily spending" meta={monthLabel} empty={isEmpty} emptyLabel="No spending in this period yet">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.accent} stopOpacity={0.18} />
              <stop offset="100%" stopColor={chartColors.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} interval={4} />
          <YAxis hide />
          <Tooltip content={CustomTooltip} cursor={{ stroke: chartColors.cursorLine }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={chartColors.accent}
            strokeWidth={2}
            fill="url(#dailyGradient)"
            dot={false}
            activeDot={{ r: 4, fill: chartColors.accent, stroke: chartColors.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
