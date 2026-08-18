"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCitiesApi,
  getPickupLocationsAdminApi,
  createPickupLocationApi,
  updatePickupLocationApi,
  deletePickupLocationApi,
} from "@/services/locations-admin.service";
import type {
  CityAdmin,
  PickupLocationAdmin,
} from "@/types/location-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function PickupLocationsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<PickupLocationAdmin[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PickupLocationAdmin | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PickupLocationAdmin | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load(targetPage: number, reset: boolean) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPickupLocationsAdminApi(
        token,
        targetPage,
        undefined,
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
    setItems([]);
    load(1, true);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setItems([]);
    load(1, true);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deletePickupLocationApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Pickup Locations</h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or address..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-yellow"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-secondary text-sm font-bold"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="space-y-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-font-dim">
                {p.city_name}
                {p.address ? ` — ${p.address}` : ""}
              </p>
              {(p.latitude || p.longitude) && (
                <p className="text-xs text-font-dim">
                  {p.latitude}, {p.longitude}
                </p>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setEditing(p)}
                className="text-xs font-bold text-brand-yellow-lg"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(p);
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

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No pickup locations found.
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
        <PickupLocationFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [saved, ...prev]
                : prev.map((p) => (p.id === saved.id ? saved : p)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this pickup location?"
          message="If any vehicle listing uses this location, deletion will be blocked."
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

function PickupLocationFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: PickupLocationAdmin | null;
  onClose: () => void;
  onSaved: (p: PickupLocationAdmin) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [latitude, setLatitude] = useState(initial?.latitude ?? "");
  const [longitude, setLongitude] = useState(initial?.longitude ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cityQuery, setCityQuery] = useState(initial?.city_name ?? "");
  const [cityResults, setCityResults] = useState<CityAdmin[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    initial?.city ?? null,
  );
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    if (!cityQuery.trim() || selectedCityId) {
      setCityResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCityLoading(true);
      const res = await getCitiesApi(token, 1, undefined, cityQuery);
      if (res.success && res.data) setCityResults(res.data.results);
      setCityLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery, selectedCityId, token]);

  async function handleSubmit() {
    if (!selectedCityId) {
      setError("Select a city.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const data = {
      name,
      address,
      city: selectedCityId,
      latitude: latitude || null,
      longitude: longitude || null,
    };
    const res = initial
      ? await updatePickupLocationApi(token, initial.id, data)
      : await createPickupLocationApi(token, data);
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
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-heading font-bold text-base">
          {initial ? "Edit" : "New"} pickup location
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            City
          </label>
          <input
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setSelectedCityId(null);
            }}
            placeholder="Search for a city..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          {cityLoading && (
            <p className="text-xs text-font-dim mt-1">Searching...</p>
          )}
          {cityResults.length > 0 && (
            <div className="mt-1 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-40 overflow-y-auto">
              {cityResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCityId(c.id);
                    setCityQuery(c.name);
                    setCityResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {c.name},{" "}
                  <span className="text-font-dim">{c.state_name}</span>
                </button>
              ))}
            </div>
          )}
          {selectedCityId && (
            <p className="text-xs text-green-600 mt-1">City selected ✓</p>
          )}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Location name"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          placeholder="Address (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={latitude ?? ""}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            value={longitude ?? ""}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
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
            disabled={submitting || !name.trim() || !selectedCityId}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
