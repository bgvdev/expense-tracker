"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useExpenseStats } from "@/hooks/useExpenseStats";
import { useToast } from "@/hooks/useToast";
import CategoryPanel from "@/components/CategoryPanel";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import type { Category, NewCategory } from "@/lib/types";
import Page from "@/components/layout/Page";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ConfirmDialog, { ConfirmPreview } from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import CategoryTable from "@/components/CategoryTable";
import { LoadingState } from "@/components/ui/Spinner";
import { plural } from "@/lib/format";

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
  const { categories, loading: catLoading, error: catError, fetchCategories, addCategory, updateCategory, removeCategory } = useCategories();
  // Per-category counts span all of the user's expenses; the API counts them.
  const { stats, loading: expensesLoading, error: statsError } = useExpenseStats();
  const { showToast } = useToast();

  const [panelOpen, setPanelOpen]       = useState(false);
  const [editingCat, setEditingCat]     = useState<Category | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  useEffect(() => {
    if (user) fetchCategories();
  }, [user, fetchCategories]);

  // Expense count per category id; a category with no expenses is absent (0).
  const expenseCountById = useMemo(
    () => new Map((stats?.by_category ?? []).map((row) => [row.category.id, row.count])),
    [stats],
  );

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

  // Errors propagate to ConfirmDialog, which keeps itself open and shows them
  // (e.g. the API's 422 when expenses still reference the category).
  async function handleDelete(id: number) {
    await removeCategory(id);
    showToast("Category deleted.");
  }

  function openAdd() {
    setEditingCat(undefined);
    setPanelOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setPanelOpen(true);
  }

  if (!user) return null;

  const loading = catLoading || expensesLoading;

  return (
    <>
      <CategoryPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditingCat(undefined); }}
        category={editingCat}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => { if (pendingDelete) await handleDelete(pendingDelete.id); }}
        title="Delete this category?"
        description="This permanently removes the category. It can't be undone."
      >
        {pendingDelete && (
          <ConfirmPreview
            leading={<CategoryIcon icon={pendingDelete.icon} color={pendingDelete.color} />}
            title={pendingDelete.name}
            subtitle={plural(expenseCountById.get(pendingDelete.id) ?? 0, "expense")}
          />
        )}
      </ConfirmDialog>

      <Page>
        <PageHeader
          title="Categories"
          description={loading ? "Loading…" : `${userCats.length} custom · ${globalCats.length} default`}
          actions={
            <Button variant="primary" icon="add" collapseLabel onClick={openAdd} aria-label="New category">
              New category
            </Button>
          }
        />

        {catError && <Alert className="mb-6">{catError}</Alert>}

        {/* Without this every row would show a confident "0 expenses" — and
            offer to delete a category the API will refuse to remove. */}
        {statsError && statsError !== "unauthenticated" && (
          <Alert className="mb-6">{statsError}</Alert>
        )}

        {loading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader
                title="Your categories"
                description={`${userCats.length} custom ${userCats.length === 1 ? "category" : "categories"}`}
                action={<Button size="sm" icon="add" onClick={openAdd}>Add category</Button>}
                className="items-center border-b border-border"
              />
              {userCats.length === 0 ? (
                <EmptyState
                  icon="label"
                  title="No custom categories yet"
                  description="Create a category to organize your expenses your way."
                  action={<Button size="sm" variant="primary" icon="add" onClick={openAdd}>Create category</Button>}
                />
              ) : (
                <CategoryTable
                  categories={userCats}
                  expenseCount={(c) => expenseCountById.get(c.id) ?? 0}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              )}
            </Card>

            {globalCats.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader
                  title={<span className="inline-flex items-center gap-2">Default categories <Badge>Read-only</Badge></span>}
                  description="Shared by everyone and managed by admins"
                  className="border-b border-border"
                />
                <CategoryTable
                  categories={globalCats}
                  expenseCount={(c) => expenseCountById.get(c.id) ?? 0}
                />
              </Card>
            )}
          </div>
        )}
      </Page>
    </>
  );
}
