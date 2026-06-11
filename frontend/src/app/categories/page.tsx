"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import CategoryModal from "@/components/CategoryModal";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import type { Category, NewCategory } from "@/lib/types";

export default function CategoriesPage() {
  return (
    <RequireAuth>
      <AppShell>
        <CategoriesContent />
      </AppShell>
    </RequireAuth>
  );
}

function CategoriesContent() {
  const { user } = useAuth();
  const { categories, loading: catLoading, fetchCategories, addCategory, updateCategory, removeCategory } = useCategories();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen]       = useState(false);
  const [editingCat, setEditingCat]     = useState<Category | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    if (user) fetchCategories();
  }, [user, fetchCategories]);

  // Expense count per category id
  const expenseCountById = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of expenses) {
      map.set(e.category.id, (map.get(e.category.id) ?? 0) + 1);
    }
    return map;
  }, [expenses]);

  const globalCats = useMemo(() => categories.filter((c) => c.is_global), [categories]);
  const userCats   = useMemo(() => categories.filter((c) => !c.is_global), [categories]);

  async function handleSave(data: NewCategory) {
    if (editingCat) {
      await updateCategory(editingCat.id, data);
      showToast("Category updated!");
    } else {
      await addCategory(data);
      showToast("Category created!");
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await removeCategory(id);
      showToast("Category deleted.");
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      showToast(apiErr?.data?.message ?? "Failed to delete category.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditingCat(undefined);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setModalOpen(true);
  }

  if (!user) return null;

  const loading = catLoading || expensesLoading;

  return (
    <>
      <CategoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCat(undefined); }}
        category={editingCat}
        onSave={handleSave}
      />

      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Categories
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {loading ? "Loading…" : `${userCats.length} custom · ${globalCats.length} default`}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-semibold transition-all"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
            <span className="hidden sm:inline">New Category</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30 gap-3">
            <span className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Your categories ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">Your Categories</h2>
                <span className="text-xs text-white/25">{userCats.length} custom</span>
              </div>

              {userCats.length === 0 ? (
                <button
                  onClick={openAdd}
                  className="w-full flex items-center justify-center gap-2 p-8 rounded-2xl border border-dashed border-white/10 text-white/30 hover:border-indigo-500/30 hover:text-indigo-300/50 transition-all"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>add_circle</span>
                  <span className="text-sm font-medium">Create your first category</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userCats.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      expenseCount={expenseCountById.get(cat.id) ?? 0}
                      confirmDeleteId={confirmDeleteId}
                      deleting={deleting}
                      onEdit={() => openEdit(cat)}
                      onDeleteRequest={() => setConfirmDeleteId(cat.id)}
                      onDeleteConfirm={() => handleDelete(cat.id)}
                      onDeleteCancel={() => setConfirmDeleteId(null)}
                    />
                  ))}
                  {/* Add new card */}
                  <button
                    onClick={openAdd}
                    className="flex items-center justify-center gap-2 p-5 rounded-2xl border border-dashed border-white/10 text-white/25 hover:border-indigo-500/30 hover:text-indigo-300/50 transition-all min-h-[80px]"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
                    <span className="text-sm font-medium">Add category</span>
                  </button>
                </div>
              )}
            </section>

            {/* ── Default categories ── */}
            {globalCats.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">Default Categories</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold uppercase tracking-wide">
                    Global · Read-only
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {globalCats.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] opacity-60"
                    >
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.color + "25" }}
                      >
                        <span className="material-symbols-rounded text-xl" style={{ color: cat.color }}>{cat.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {expenseCountById.get(cat.id) ?? 0} expense{(expenseCountById.get(cat.id) ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-[10px] text-white/20 font-medium shrink-0">Global</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </>
  );
}

// ── Category card (user-owned) ─────────────────────────────────────────────
interface CategoryCardProps {
  cat: Category;
  expenseCount: number;
  confirmDeleteId: number | null;
  deleting: boolean;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function CategoryCard({ cat, expenseCount, confirmDeleteId, deleting, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: CategoryCardProps) {
  const isConfirming = confirmDeleteId === cat.id;
  const hasExpenses  = expenseCount > 0;

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:border-white/15">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cat.color + "25" }}
      >
        <span className="material-symbols-rounded text-xl" style={{ color: cat.color }}>{cat.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
        <p className="text-xs text-white/35 mt-0.5">
          {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
        </p>
      </div>

      {isConfirming ? (
        /* Inline confirmation row */
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/40 hidden sm:inline">Delete?</span>
          <button
            onClick={onDeleteConfirm}
            disabled={deleting}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold transition-all disabled:opacity-50"
          >
            {deleting ? "…" : "Yes"}
          </button>
          <button
            onClick={onDeleteCancel}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-xs font-semibold transition-all"
          >
            No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Edit */}
          <button
            onClick={onEdit}
            className="h-8 w-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 transition-all"
            title="Edit"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
          </button>
          {/* Delete — disabled if category has expenses */}
          <button
            onClick={hasExpenses ? undefined : onDeleteRequest}
            disabled={hasExpenses}
            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
              hasExpenses
                ? "bg-white/[0.03] border-white/[0.06] text-white/20 cursor-not-allowed"
                : "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
            }`}
            title={hasExpenses ? `Can't delete — ${expenseCount} expense${expenseCount !== 1 ? "s" : ""} use this category` : "Delete"}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
