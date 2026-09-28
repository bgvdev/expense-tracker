"use client";

import { useState, useEffect } from "react";
import SidePanel from "@/components/ui/SidePanel";
import IconPicker from "@/components/ui/IconPicker";
import ColorPicker from "@/components/ui/ColorPicker";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { Category, NewCategory } from "@/lib/types";

interface CategoryPanelProps {
  open: boolean;
  onClose: () => void;
  category?: Category;
  onSave: (data: NewCategory) => Promise<void>;
}

export default function CategoryPanel({ open, onClose, category, onSave }: CategoryPanelProps) {
  const [name, setName]   = useState(category?.name ?? "");
  const [icon, setIcon]   = useState(category?.icon ?? "category");
  const [color, setColor] = useState(category?.color ?? "#6366F1");
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset fields each time the panel opens
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
    <SidePanel
      open={open}
      onClose={onClose}
      title={category ? "Edit category" : "New category"}
      description={category ? "Change its name, icon or color" : "Group your expenses with your own category"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="category-form" variant="primary" loading={saving}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert>{formError}</Alert>}

        <Field label="Name" htmlFor="category-name">
          <div className="flex items-center gap-2">
            <CategoryIcon icon={icon} color={color} size="lg" />
            <div className="flex-1">
              <Input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Groceries"
                autoFocus
              />
            </div>
          </div>
        </Field>

        <Field label="Icon">
          <IconPicker value={icon} onChange={setIcon} />
        </Field>

        <Field label="Color" hint="Click the swatch to pick any color, or type a hex code.">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </form>
    </SidePanel>
  );
}
