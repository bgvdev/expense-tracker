import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface ChartCardProps {
  title: string;
  meta?: string;
  empty?: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
}

/** Frame shared by every report chart: title, optional period label, empty state. */
export default function ChartCard({ title, meta, empty, emptyLabel = "No data yet", children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} action={meta && <span className="text-xs text-muted">{meta}</span>} />
      <CardBody>
        {empty ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted">{emptyLabel}</div>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
}

/** Theme-token colors for recharts props (SVG attributes accept CSS vars). */
export const chartColors = {
  accent: "rgb(var(--accent))",
  tick: "rgb(var(--muted))",
  surface: "rgb(var(--surface))",
  cursor: "rgb(var(--foreground) / 0.05)",
  cursorLine: "rgb(var(--border))",
};

export const tickStyle = { fill: chartColors.tick, fontSize: 11 };

export function ChartTooltip({ label, value, sub }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-md">
      <p className="mb-0.5 text-xs text-muted">{label}</p>
      <p className="font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
