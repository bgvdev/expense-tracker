import { cn } from "@/lib/cn";
import Icon from "./Icon";

type Tone = "error" | "info" | "success" | "warning";

const tones: Record<Tone, { cls: string; icon: string }> = {
  error:   { cls: "border-danger/30 bg-danger/5 text-danger",    icon: "error" },
  info:    { cls: "border-accent/30 bg-accent/5 text-accent",    icon: "info" },
  success: { cls: "border-success/30 bg-success/5 text-success", icon: "check_circle" },
  warning: { cls: "border-warning/30 bg-warning/5 text-warning", icon: "warning" },
};

export default function Alert({ tone = "error", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  const t = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm", t.cls, className)}>
      <Icon name={t.icon} size={18} className="mt-px" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
