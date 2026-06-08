import { Expense } from "@/lib/types";

export function exportToCSV(expenses: Expense[]): void {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;

  const header = ["Date", "Description", "Category", "Amount (INR)"];
  const rows = expenses.map((e) => [
    escape(e.spent_at.split("T")[0]),
    escape(e.description ?? ""),
    escape(e.category.name),
    escape(Number(e.amount).toFixed(2)),
  ]);

  const csv = [header.map(escape), ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
