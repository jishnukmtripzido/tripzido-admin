"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCountriesApi,
  getStatesApi,
  createStateApi,
  updateStateApi,
  deleteStateApi,
} from "@/services/locations-admin.service";
import type { CountryAdmin, StateAdmin } from "@/types/location-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function StatesPage() {
  const { token } = useAdminAuth();
  const [countries, setCountries] = useState<CountryAdmin[]>([]);
  const [items, setItems] = useState<StateAdmin[]>([]);
  const [filterCountry, setFilterCountry] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StateAdmin | "new" | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StateAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const [countriesRes, statesRes] = await Promise.all([
      getCountriesApi(token),
      getStatesApi(token, filterCountry || undefined),
    ]);
    if (countriesRes.success && countriesRes.data)
      setCountries(countriesRes.data);
    if (statesRes.success && statesRes.data) setItems(statesRes.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token, filterCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(s: StateAdmin | "new") {
    setEditing(s);
    setName(s === "new" ? "" : s.name);
    setCode(s === "new" ? "" : s.code);
    setCountryId(s === "new" ? (countries[0]?.id ?? null) : s.country);
    setError(null);
  }

  async function handleSave() {
    if (!token || !name.trim() || !countryId) return;
    setSubmitting(true);
    setError(null);
    const data = { name, code, country: countryId };
    const res =
      editing === "new"
        ? await createStateApi(token, data)
        : await updateStateApi(token, (editing as StateAdmin).id, data);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to save");
      setSubmitting(false);
      return;
    }
    setItems((prev) =>
      editing === "new"
        ? [...prev, res.data!]
        : prev.map((s) => (s.id === res.data!.id ? res.data! : s)),
    );
    setEditing(null);
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteStateApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">States</h1>
        <button
          onClick={() => openEdit("new")}
          disabled={countries.length === 0}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + New
        </button>
      </div>

      <select
        value={filterCountry}
        onChange={(e) =>
          setFilterCountry(e.target.value ? Number(e.target.value) : "")
        }
        className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-font-dim">
                {s.country_name}
                {s.code ? ` • ${s.code}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(s)}
                className="text-xs font-bold text-brand-yellow-lg"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(s);
                  setDeleteError(null);
                }}
                className="text-xs font-bold text-red-500"
              >
                Del
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-font-dim col-span-full">
            No states found.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setEditing(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
            <h3 className="font-heading font-bold text-base">
              {editing === "new" ? "New" : "Edit"} state
            </h3>
            <select
              value={countryId ?? ""}
              onChange={(e) => setCountryId(Number(e.target.value) || null)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="State name"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Short code, e.g. MH (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
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
                disabled={submitting || !name.trim() || !countryId}
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
          title="Delete this state?"
          message="If any city exists under it, deletion will be blocked."
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
