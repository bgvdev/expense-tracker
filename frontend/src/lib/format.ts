const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹1,234.50 — or ₹1,235 with `{ decimals: false }`. */
export function formatCurrency(value: number | string, { decimals = true } = {}): string {
  const n = typeof value === "string" ? Number(value) : value;
  return (decimals ? inr2 : inr0).format(Number.isFinite(n) ? n : 0);
}

/** "Sep 28, 2026" */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
