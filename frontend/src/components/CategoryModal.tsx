"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import IconPicker from "@/components/ui/IconPicker";
import ColorPicker from "@/components/ui/ColorPicker";
import { Category, NewCategory } from "@/lib/types";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  category?: Category;
  onSave: (data: NewCategory) => Promise<void>;
}

export default function CategoryModal({ open, onClose, category, onSave }: CategoryModalProps) {
  const [name, setName]   = useState(category?.name ?? "");
  const [icon, setIcon]   = useState(category?.icon ?? "category");
  const [color, setColor] = useState(category?.color ?? "#6366F1");
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset fields when modal opens
  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setIcon(category?.icon ?? "category");
      setColor(category?.color ?? "#6366F1");
      setFormError(null);
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError(null);
    try {
      await onSave({ name: name.trim(), icon, color });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const errors = apiErr?.data?.errors;
      if (errors) {
        setFormError(Object.values(errors).flat().join(" "));
      } else {
        setFormError(apiErr?.data?.message ?? "Failed to save category.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Edit Category" : "New Category"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-form"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving && <span className="material-symbols-rounded animate-spin" style={{ fontSize: 16 }}>progress_activity</span>}
            {category ? "Save changes" : "Create category"}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span className="material-symbols-rounded shrink-0" style={{ fontSize: 16 }}>error</span>
            {formError}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="e.g. Groceries"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: color + "33", color }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">{name || "Preview"}</p>
            <p className="text-xs text-white/30">{icon}</p>
          </div>
        </div>

        {/* Icon picker */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Icon</label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </form>
    </Modal>
  );
}
