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
import ChartCard, { ChartTooltip, chartColors, tickStyle } from "./ChartCard";
import { formatCurrency } from "@/lib/format";

interface DataPoint {
  month: string;
  total: number;
}

interface Props {
  data: DataPoint[];
  periodLabel?: string;
}

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return <ChartTooltip label={label} value={formatCurrency(Number(payload[0].value ?? 0), { decimals: false })} />;
}

export default function MonthlyBarChart({ data, periodLabel = "Last 6 months" }: Props) {
  const isEmpty = data.every((d) => d.total === 0);

  return (
    <ChartCard title="Monthly spending" meta={periodLabel} empty={isEmpty} emptyLabel="No spending data yet">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={CustomTooltip} cursor={{ fill: chartColors.cursor }} />
          <Bar dataKey="total" fill={chartColors.accent} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
