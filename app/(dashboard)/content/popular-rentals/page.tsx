"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getPopularRentalsApi,
  createPopularRentalApi,
  updatePopularRentalApi,
  deletePopularRentalApi,
} from "@/services/content-admin.service";
import {
  getCitiesApi,
  getPickupLocationsAdminApi,
} from "@/services/locations-admin.service";
import { getVehicleTypesAdminApi } from "@/services/catalog.service";
import type { PopularRentalAdmin } from "@/types/content-admin.types";
import type {
  CityAdmin,
  PickupLocationAdmin,
} from "@/types/location-admin.types";
import type { VehicleTypeAdmin } from "@/types/listing-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function PopularRentalsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<PopularRentalAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PopularRentalAdmin | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PopularRentalAdmin | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getPopularRentalsApi(token);
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
    const res = await deletePopularRentalApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Popular Rentals</h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Pins a vehicle type to a city's "Popular rentals" homepage carousel.
        Display fields are optional overrides — each falls back to the vehicle
        type's own value when left blank.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-3"
          >
            <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {p.display_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.display_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-gray-300">No image</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {p.display_name || p.vehicle_type_name}
              </p>
              <p className="text-xs text-font-dim">
                {p.city_name}
                {p.pickup_location_name ? ` — ${p.pickup_location_name}` : ""}
              </p>
              <p className="text-xs text-font-dim">
                {p.vehicle_type_name}
                {p.tag ? ` • ${p.tag}` : ""}
                {p.display_price ? ` • ₹${p.display_price}` : ""}
              </p>
              <div className="flex gap-3 mt-2">
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
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-font-dim col-span-full text-center py-10">
            No popular rentals yet.
          </p>
        )}
      </div>

      {editing && (
        <PopularRentalFormModal
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
          title="Delete this popular rental?"
          message="This will remove it from the city's homepage carousel."
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

function PopularRentalFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: PopularRentalAdmin | null;
  onClose: () => void;
  onSaved: (p: PopularRentalAdmin) => void;
  token: string;
}) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [displayPrice, setDisplayPrice] = useState(
    initial?.display_price ?? "",
  );
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cityQuery, setCityQuery] = useState(initial?.city_name ?? "");
  const [cityResults, setCityResults] = useState<CityAdmin[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(
    initial?.city ?? null,
  );
  const [cityLoading, setCityLoading] = useState(false);

  const [vtQuery, setVtQuery] = useState(initial?.vehicle_type_name ?? "");
  const [vtResults, setVtResults] = useState<VehicleTypeAdmin[]>([]);
  const [selectedVtId, setSelectedVtId] = useState<number | null>(
    initial?.vehicle_type ?? null,
  );
  const [vtLoading, setVtLoading] = useState(false);

  const [locations, setLocations] = useState<PickupLocationAdmin[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    initial?.pickup_location ?? null,
  );
  const [locationsLoading, setLocationsLoading] = useState(false);

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

  useEffect(() => {
    if (!vtQuery.trim() || selectedVtId) {
      setVtResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setVtLoading(true);
      const res = await getVehicleTypesAdminApi(token, 1, vtQuery);
      if (res.success && res.data) setVtResults(res.data.results);
      setVtLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [vtQuery, selectedVtId, token]);

  useEffect(() => {
    if (!selectedCityId) {
      setLocations([]);
      return;
    }
    (async () => {
      setLocationsLoading(true);
      const res = await getPickupLocationsAdminApi(token, 1, selectedCityId);
      if (res.success && res.data) setLocations(res.data.results);
      setLocationsLoading(false);
    })();
  }, [selectedCityId, token]);

  async function handleSubmit() {
    if (!selectedCityId || !selectedVtId) {
      setError("Select a city and a vehicle type.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fields: Record<string, string | number | File | null> = {
      city: selectedCityId,
      vehicle_type: selectedVtId,
      display_name: displayName,
      display_price: displayPrice,
      tag,
      sort_order: Number(sortOrder) || 0,
    };
    if (selectedLocationId) fields.pickup_location = selectedLocationId;
    if (imageFile) fields.display_image = imageFile;
    const res = initial
      ? await updatePopularRentalApi(token, initial.id, fields)
      : await createPopularRentalApi(token, fields);
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
          {initial ? "Edit" : "New"} popular rental
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
              setSelectedLocationId(null);
            }}
            placeholder="Search for a city..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          {cityLoading && (
            <p className="text-xs text-font-dim mt-1">Searching...</p>
          )}
          {cityResults.length > 0 && (
            <div className="mt-1 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-32 overflow-y-auto">
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
        </div>

        {selectedCityId && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Pickup location (optional)
            </label>
            {locationsLoading ? (
              <p className="text-xs text-font-dim">Loading...</p>
            ) : (
              <select
                value={selectedLocationId ?? ""}
                onChange={(e) =>
                  setSelectedLocationId(Number(e.target.value) || null)
                }
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                <option value="">
                  None — falls back to vendor's primary location
                </option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Vehicle type
          </label>
          <input
            value={vtQuery}
            onChange={(e) => {
              setVtQuery(e.target.value);
              setSelectedVtId(null);
            }}
            placeholder="Search by name or brand..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          {vtLoading && (
            <p className="text-xs text-font-dim mt-1">Searching...</p>
          )}
          {vtResults.length > 0 && (
            <div className="mt-1 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-32 overflow-y-auto">
              {vtResults.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVtId(v.id);
                    setVtQuery(`${v.brand_name} ${v.name}`);
                    setVtResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {v.brand_name} {v.name}{" "}
                  <span className="text-font-dim">({v.make_year})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name override (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="number"
          value={displayPrice}
          onChange={(e) => setDisplayPrice(e.target.value)}
          placeholder="Display price override (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Badge tag, e.g. Best Seller (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Image override (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {initial?.display_image && !imageFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initial.display_image}
              alt=""
              className="h-16 w-16 object-cover rounded-lg mt-2 border border-gray-100"
            />
          )}
        </div>

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
            disabled={submitting || !selectedCityId || !selectedVtId}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
