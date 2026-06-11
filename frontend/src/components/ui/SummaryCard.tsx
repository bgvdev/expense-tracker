interface SummaryCardProps {
  label: string;
  value: number;
  icon: string;
  accent: "indigo" | "purple" | "pink";
  isCurrency?: boolean;
  loading: boolean;
}

const accentClasses: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
  pink:   { bg: "bg-pink-500/20",   text: "text-pink-400"   },
};

export default function SummaryCard({ label, value, icon, accent, isCurrency = true, loading }: SummaryCardProps) {
  const { bg, text } = accentClasses[accent];

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <span className={`material-symbols-rounded text-2xl ${text}`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-6 w-24 bg-white/10 rounded animate-pulse" />
        ) : (
          <p className={`text-2xl font-extrabold ${text}`}>
            {isCurrency
              ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : value}
          </p>
        )}
      </div>
    </div>
  );
}
