"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getStatesApi,
  getCitiesApi,
  createCityApi,
  updateCityApi,
  deleteCityApi,
} from "@/services/locations-admin.service";
import type { StateAdmin, CityAdmin } from "@/types/location-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CitiesPage() {
  const { token } = useAdminAuth();
  const [states, setStates] = useState<StateAdmin[]>([]);
  const [items, setItems] = useState<CityAdmin[]>([]);
  const [filterState, setFilterState] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CityAdmin | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CityAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadStates() {
    if (!token) return;
    const res = await getStatesApi(token);
    if (res.success && res.data) setStates(res.data);
  }

  async function load(targetPage: number, reset: boolean) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCitiesApi(
        token,
        targetPage,
        filterState || undefined,
        search || undefined,
      );
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load");
        return;
      }
      setItems((prev) =>
        reset ? res.data!.results : [...prev, ...res.data!.results],
      );
      setHasNext(res.data.pagination.next !== null);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStates();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setItems([]);
    load(1, true);
  }, [token, filterState]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setItems([]);
    load(1, true);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteCityApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Cities</h1>
        <button
          onClick={() => setEditing("new")}
          disabled={states.length === 0}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + New
        </button>
      </div>

      <div className="flex gap-2">
        <select
          value={filterState}
          onChange={(e) =>
            setFilterState(e.target.value ? Number(e.target.value) : "")
          }
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-yellow"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-secondary text-sm font-bold"
          >
            Search
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {c.city_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.city_image}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-gray-300">No image</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-font-dim">
                {c.state_name}, {c.country_name}
              </p>
              <div className="flex gap-3 mt-2">
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
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No cities found.
        </p>
      )}
      {loading && items.length > 0 && <InlineLoader />}
      {hasNext && !loading && (
        <button
          onClick={() => load(page + 1, false)}
          className="w-full text-sm font-semibold text-brand-yellow-lg py-2"
        >
          Load more
        </button>
      )}

      {editing && (
        <CityFormModal
          initial={editing === "new" ? null : editing}
          states={states}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [saved, ...prev]
                : prev.map((c) => (c.id === saved.id ? saved : c)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this city?"
          message="If any pickup location exists under it, deletion will be blocked."
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

function CityFormModal({
  initial,
  states,
  onClose,
  onSaved,
  token,
}: {
  initial: CityAdmin | null;
  states: StateAdmin[];
  onClose: () => void;
  onSaved: (c: CityAdmin) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [stateId, setStateId] = useState<number | null>(
    initial?.state ?? states[0]?.id ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!stateId) {
      setError("Select a state.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fields: Record<string, string | number | File | null> = {
      name,
      state: stateId,
    };
    if (imageFile) fields.city_image = imageFile;
    const res = initial
      ? await updateCityApi(token, initial.id, fields)
      : await createCityApi(token, fields);
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
          {initial ? "Edit" : "New"} city
        </h3>
        <select
          value={stateId ?? ""}
          onChange={(e) => setStateId(Number(e.target.value) || null)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="City name"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            City image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {initial?.city_image && !imageFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initial.city_image}
              alt=""
              className="h-16 w-16 object-cover rounded-lg mt-2 border border-gray-100"
            />
          )}
        </div>
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
            disabled={submitting || !name.trim() || !stateId}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
