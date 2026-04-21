export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full text-center">
        <div className="mb-6 flex justify-center">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Day 1 · Skeleton
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Expense Tracker
        </h1>

        <p className="text-2xl font-semibold text-white/80 mb-4">
          Skeleton Live ✓
        </p>

        <p className="text-gray-400 max-w-xl mx-auto text-base">
          Laravel API · Next.js 15 · PostgreSQL · Docker — monorepo scaffold
          is running successfully.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { label: "API", port: ":8000", status: "Laravel 11 + PHP 8.3" },
            { label: "Web", port: ":3000", status: "Next.js 15 + Tailwind" },
            { label: "DB", port: ":5432", status: "PostgreSQL 15 Alpine" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="text-xs text-gray-500 mb-1 font-mono">{s.port}</p>
              <p className="text-lg font-bold text-white">{s.label}</p>
              <p className="text-sm text-gray-400">{s.status}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
