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
  method: string;
  total: number;
}

interface Props {
  data: DataPoint[];
}

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return <ChartTooltip label={label} value={formatCurrency(Number(payload[0].value ?? 0), { decimals: false })} />;
}

export default function PaymentMethodChart({ data }: Props) {
  const isEmpty = data.length === 0 || data.every((d) => d.total === 0);

  // One measure across methods is a single series, so it gets a single hue;
  // the method names on the axis carry identity.
  return (
    <ChartCard title="By payment method" empty={isEmpty} emptyLabel="No payment method data yet">
      <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 160)}>
        <BarChart data={data} layout="vertical" barCategoryGap="25%">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="method"
            tick={{ ...tickStyle, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={CustomTooltip} cursor={{ fill: chartColors.cursor }} />
          <Bar dataKey="total" fill={chartColors.accent} radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
