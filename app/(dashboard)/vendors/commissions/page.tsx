"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCommissionsApi,
  createCommissionApi,
  updateCommissionApi,
  deleteCommissionApi,
} from "@/services/vendors.service";
import type { VendorCommission } from "@/types/vendor.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CommissionsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<VendorCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VendorCommission | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorCommission | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getCommissionsApi(token);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteCommissionApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">
          Commission Structures
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <div className="space-y-3">
        {items.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-font-dim">
                {c.commission_type} • {c.flat_percentage ?? "—"}%
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(c)}
                className="text-xs font-bold text-brand-yellow-lg"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(c);
                  setDeleteError(null);
                }}
                className="text-xs font-bold text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CommissionFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [...prev, saved]
                : prev.map((c) => (c.id === saved.id ? saved : c)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this commission structure?"
          message="If it's used by any subscription plan, deletion will be blocked."
          confirmLabel="Delete"
          destructive
          submitting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function CommissionFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: VendorCommission | null;
  onClose: () => void;
  onSaved: (c: VendorCommission) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [percentage, setPercentage] = useState(initial?.flat_percentage ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const data = {
      name,
      commission_type: "FLAT",
      flat_percentage: percentage,
      description,
    };
    const res = initial
      ? await updateCommissionApi(token, initial.id, data)
      : await createCommissionApi(token, data);
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
          {initial ? "Edit" : "New"} commission structure
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name, e.g. Standard 10%"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          placeholder="Flat percentage"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
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
