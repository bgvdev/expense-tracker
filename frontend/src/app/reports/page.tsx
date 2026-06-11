import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";

export default function ReportsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Reports
            </h1>
            <p className="text-white/40 text-sm mt-1">Spending insights and charts</p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-12 flex flex-col items-center justify-center gap-4 text-center">
            <span className="h-16 w-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-rounded text-indigo-400 text-4xl">bar_chart</span>
            </span>
            <div>
              <p className="text-white/70 font-semibold">Charts coming soon</p>
              <p className="text-white/30 text-sm mt-1">
                Spending breakdowns, monthly trends, and more — in the next feature.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
