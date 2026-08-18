"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCountriesApi,
  createCountryApi,
  updateCountryApi,
  deleteCountryApi,
} from "@/services/locations-admin.service";
import type { CountryAdmin } from "@/types/location-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CountriesPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<CountryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CountryAdmin | "new" | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CountryAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getCountriesApi(token);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(c: CountryAdmin | "new") {
    setEditing(c);
    setName(c === "new" ? "" : c.name);
    setCode(c === "new" ? "" : c.code);
    setError(null);
  }

  async function handleSave() {
    if (!token || !name.trim() || !code.trim()) return;
    setSubmitting(true);
    setError(null);
    const data = { name, code: code.toUpperCase() };
    const res =
      editing === "new"
        ? await createCountryApi(token, data)
        : await updateCountryApi(token, (editing as CountryAdmin).id, data);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to save");
      setSubmitting(false);
      return;
    }
    setItems((prev) =>
      editing === "new"
        ? [...prev, res.data!]
        : prev.map((c) => (c.id === res.data!.id ? res.data! : c)),
    );
    setEditing(null);
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteCountryApi(token, deleteTarget.id);
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
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Countries</h1>
        <button
          onClick={() => openEdit("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
          >
            <span className="text-sm font-medium">
              {c.name} <span className="text-font-dim">({c.code})</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(c)}
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
                Del
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setEditing(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
            <h3 className="font-heading font-bold text-base">
              {editing === "new" ? "New" : "Edit"} country
            </h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Country name"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ISO code, e.g. IND"
              maxLength={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm uppercase"
            />
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(null)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !name.trim() || !code.trim()}
                className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this country?"
          message="If any state exists under it, deletion will be blocked."
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
