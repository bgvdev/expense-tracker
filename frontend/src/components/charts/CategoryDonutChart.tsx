"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipContentProps } from "recharts";
import type { Category } from "@/lib/types";
import ChartCard, { ChartTooltip, chartColors } from "./ChartCard";
import Icon from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/format";

interface DataPoint {
  category: Category;
  total: number;
  percentage: number;
}

interface Props {
  data: DataPoint[];
}

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as DataPoint;
  return (
    <ChartTooltip
      label={entry.category.name}
      value={formatCurrency(entry.total, { decimals: false })}
      sub={`${entry.percentage}%`}
    />
  );
}

export default function CategoryDonutChart({ data }: Props) {
  const isEmpty = data.length === 0;

  return (
    <ChartCard title="By category" empty={isEmpty} emptyLabel="No category data yet">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={1}
            dataKey="total"
            stroke={chartColors.surface}
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.category.id} fill={entry.category.color} />
            ))}
          </Pie>
          <Tooltip content={CustomTooltip} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="mt-4 space-y-2">
        {data.slice(0, 5).map((entry) => (
          <li key={entry.category.id} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.category.color }} />
            <Icon name={entry.category.icon} size={15} className="text-faint" />
            <span className="flex-1 truncate text-foreground">{entry.category.name}</span>
            <span className="tabular-nums text-muted">{entry.percentage}%</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
