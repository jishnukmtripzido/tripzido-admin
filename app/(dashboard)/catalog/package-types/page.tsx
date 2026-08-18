"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getPackageCategoriesApi,
  createPackageCategoryApi,
  updatePackageCategoryApi,
  deletePackageCategoryApi,
  getPackageTypesAdminApi,
  createPackageTypeApi,
  updatePackageTypeApi,
  deletePackageTypeApi,
} from "@/services/catalog.service";
import type {
  PackageCategory,
  PricingPackageTypeAdmin,
} from "@/types/listing-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function PackageTypesPage() {
  const { token } = useAdminAuth();
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [packageTypes, setPackageTypes] = useState<PricingPackageTypeAdmin[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [editingCategory, setEditingCategory] = useState<
    PackageCategory | "new" | null
  >(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<PackageCategory | null>(null);
  const [categoryDeleting, setCategoryDeleting] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(
    null,
  );

  const [editingType, setEditingType] = useState<
    PricingPackageTypeAdmin | "new" | null
  >(null);
  const [deleteTypeTarget, setDeleteTypeTarget] =
    useState<PricingPackageTypeAdmin | null>(null);
  const [typeDeleting, setTypeDeleting] = useState(false);
  const [typeDeleteError, setTypeDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const [catRes, typeRes] = await Promise.all([
      getPackageCategoriesApi(token),
      getPackageTypesAdminApi(token),
    ]);
    if (catRes.success && catRes.data) setCategories(catRes.data);
    if (typeRes.success && typeRes.data) setPackageTypes(typeRes.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget || !token) return;
    setCategoryDeleting(true);
    setCategoryDeleteError(null);
    const res = await deletePackageCategoryApi(token, deleteCategoryTarget.id);
    if (!res.success) {
      setCategoryDeleteError(res.message || "Failed to delete");
      setCategoryDeleting(false);
      return;
    }
    setCategories((prev) =>
      prev.filter((c) => c.id !== deleteCategoryTarget.id),
    );
    setDeleteCategoryTarget(null);
    setCategoryDeleting(false);
  }

  async function handleDeleteType() {
    if (!deleteTypeTarget || !token) return;
    setTypeDeleting(true);
    setTypeDeleteError(null);
    const res = await deletePackageTypeApi(token, deleteTypeTarget.id);
    if (!res.success) {
      setTypeDeleteError(res.message || "Failed to delete");
      setTypeDeleting(false);
      return;
    }
    setPackageTypes((prev) => prev.filter((p) => p.id !== deleteTypeTarget.id));
    setDeleteTypeTarget(null);
    setTypeDeleting(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading font-bold text-2xl">
            Package Categories
          </h1>
          <button
            onClick={() => setEditingCategory("new")}
            className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
          >
            + New
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-font-dim">{c.description}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingCategory(c)}
                  className="text-xs font-bold text-brand-yellow-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteCategoryTarget(c);
                    setCategoryDeleteError(null);
                  }}
                  className="text-xs font-bold text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-font-dim">No categories yet.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-2xl">Package Types</h2>
          <button
            onClick={() => setEditingType("new")}
            disabled={categories.length === 0}
            className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg disabled:opacity-50"
          >
            + New
          </button>
        </div>
        {categories.length === 0 && (
          <p className="text-sm text-font-dim bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3">
            Add at least one category above before creating a package type.
          </p>
        )}
        <div className="space-y-2">
          {packageTypes.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-font-dim">
                  {p.category_name} • {p.duration_hours}h
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingType(p)}
                  className="text-xs font-bold text-brand-yellow-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteTypeTarget(p);
                    setTypeDeleteError(null);
                  }}
                  className="text-xs font-bold text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {packageTypes.length === 0 && (
            <p className="text-sm text-font-dim">No package types yet.</p>
          )}
        </div>
      </div>

      {editingCategory && (
        <CategoryFormModal
          initial={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={(saved) => {
            setCategories((prev) =>
              editingCategory === "new"
                ? [...prev, saved]
                : prev.map((c) => (c.id === saved.id ? saved : c)),
            );
            setEditingCategory(null);
          }}
          token={token!}
        />
      )}
      {deleteCategoryTarget && (
        <ConfirmDialog
          title="Delete this category?"
          message="If any package type uses this category, deletion will be blocked."
          confirmLabel="Delete"
          destructive
          submitting={categoryDeleting}
          error={categoryDeleteError}
          onCancel={() => setDeleteCategoryTarget(null)}
          onConfirm={handleDeleteCategory}
        />
      )}

      {editingType && (
        <PackageTypeFormModal
          initial={editingType === "new" ? null : editingType}
          categories={categories}
          onClose={() => setEditingType(null)}
          onSaved={(saved) => {
            setPackageTypes((prev) =>
              editingType === "new"
                ? [...prev, saved]
                : prev.map((p) => (p.id === saved.id ? saved : p)),
            );
            setEditingType(null);
          }}
          token={token!}
        />
      )}
      {deleteTypeTarget && (
        <ConfirmDialog
          title="Delete this package type?"
          message="If any listing uses this package type, deletion will be blocked."
          confirmLabel="Delete"
          destructive
          submitting={typeDeleting}
          error={typeDeleteError}
          onCancel={() => setDeleteTypeTarget(null)}
          onConfirm={handleDeleteType}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: PackageCategory | null;
  onClose: () => void;
  onSaved: (c: PackageCategory) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const data = { name, description, sort_order: Number(sortOrder) || 0 };
    const res = initial
      ? await updatePackageCategoryApi(token, initial.id, data)
      : await createPackageCategoryApi(token, data);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to save");
      setSubmitting(false);
      return;
    }
    onSaved(res.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">
          {initial ? "Edit" : "New"} category
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hourly"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="Sort order"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageTypeFormModal({
  initial,
  categories,
  onClose,
  onSaved,
  token,
}: {
  initial: PricingPackageTypeAdmin | null;
  categories: PackageCategory[];
  onClose: () => void;
  onSaved: (p: PricingPackageTypeAdmin) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.category ?? categories[0]?.id ?? null,
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationHours, setDurationHours] = useState(
    initial?.duration_hours ?? "",
  );
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!categoryId) {
      setError("Select a category.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const data = {
      name,
      category: categoryId,
      description,
      duration_hours: durationHours,
      sort_order: Number(sortOrder) || 0,
    };
    const res = initial
      ? await updatePackageTypeApi(token, initial.id, data)
      : await createPackageTypeApi(token, data);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to save");
      setSubmitting(false);
      return;
    }
    onSaved(res.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">
          {initial ? "Edit" : "New"} package type
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(Number(e.target.value) || null)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={durationHours}
          onChange={(e) => setDurationHours(e.target.value)}
          placeholder="Duration in hours, e.g. 24"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="Sort order"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !durationHours}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
