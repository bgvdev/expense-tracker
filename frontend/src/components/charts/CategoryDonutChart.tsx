"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipContentProps } from "recharts";
import type { Category } from "@/lib/types";

interface DataPoint {
  category: Category;
  total: number;
  percentage: number;
}

interface Props {
  data: DataPoint[];
}

const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as DataPoint;
  return (
    <div className="rounded-xl bg-[#1e1e2e] border border-white/10 px-3 py-2 text-sm shadow-xl">
      <p className="text-white/50 text-xs mb-0.5">{entry.category.name}</p>
      <p className="text-white font-semibold">{fmt.format(entry.total)}</p>
      <p className="text-white/40 text-xs">{entry.percentage}%</p>
    </div>
  );
}

export default function CategoryDonutChart({ data }: Props) {
  const isEmpty = data.length === 0;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="h-8 w-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
          <span className="material-symbols-rounded text-pink-400 text-lg">donut_large</span>
        </span>
        <h2 className="text-white font-semibold text-sm">By Category</h2>
      </div>

      {isEmpty ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-sm">
          No category data yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="total"
              >
                {data.map((entry) => (
                  <Cell key={entry.category.id} fill={entry.category.color} />
                ))}
              </Pie>
              <Tooltip content={CustomTooltip} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-col gap-2">
            {data.slice(0, 5).map((entry) => (
              <div key={entry.category.id} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.category.color }}
                />
                <span className="material-symbols-rounded text-white/50 text-sm">{entry.category.icon}</span>
                <span className="text-white/70 truncate flex-1">{entry.category.name}</span>
                <span className="text-white/40">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
