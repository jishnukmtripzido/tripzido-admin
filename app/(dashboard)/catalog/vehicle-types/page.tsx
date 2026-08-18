"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getVehicleTypesAdminApi,
  createVehicleTypeApi,
  updateVehicleTypeApi,
  deleteVehicleTypeApi,
  getBrandsAdminApi,
} from "@/services/catalog.service";
import type { VehicleTypeAdmin, Brand } from "@/types/listing-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const TRANSMISSION_TYPES = ["MANUAL", "AUTOMATIC", "SEMI_AUTO"];
const FUEL_TYPES = ["PETROL", "ELECTRIC", "CNG", "HYBRID", "DIESEL"];
const VEHICLE_TYPE_CHOICES = ["CAR", "BIKE", "SCOOTER", "AUTO", "BUS", "VAN"];

export default function VehicleTypesPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<VehicleTypeAdmin[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VehicleTypeAdmin | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleTypeAdmin | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load(targetPage: number, reset: boolean) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getVehicleTypesAdminApi(
        token,
        targetPage,
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

  async function loadBrands() {
    if (!token) return;
    const res = await getBrandsAdminApi(token);
    if (res.success && res.data) setBrands(res.data);
  }

  useEffect(() => {
    setItems([]);
    load(1, true);
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setItems([]);
    load(1, true);
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteVehicleTypeApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Vehicle Types</h1>
        <button
          onClick={() => setEditing("new")}
          disabled={brands.length === 0}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + New
        </button>
      </div>

      {brands.length === 0 && (
        <p className="text-sm text-font-dim bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          Add at least one brand before creating a vehicle type — go to{" "}
          <a
            href="/catalog/brands"
            className="font-semibold text-brand-yellow-lg underline"
          >
            Brands
          </a>
          .
        </p>
      )}

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {v.primary_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.primary_image}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-300">No image</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">
                  {v.brand_name} {v.name}
                </p>
                <p className="text-xs text-font-dim">
                  {v.make_year} • {v.vehicle_type} • {v.transmission_type}
                </p>
                <p className="text-xs text-font-dim">
                  {v.fuel_type} • {v.seats} seats • {v.cc}cc
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${v.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {v.is_published ? "Published" : "Unpublished"}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
              <button
                onClick={() => setEditing(v)}
                className="text-xs font-bold text-brand-yellow-lg"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(v);
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
          No vehicle types found.
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
        <VehicleTypeFormModal
          initial={editing === "new" ? null : editing}
          brands={brands}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [saved, ...prev]
                : prev.map((v) => (v.id === saved.id ? saved : v)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this vehicle type?"
          message="If any listing uses this vehicle type, deletion will be blocked."
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

function VehicleTypeFormModal({
  initial,
  brands,
  onClose,
  onSaved,
  token,
}: {
  initial: VehicleTypeAdmin | null;
  brands: Brand[];
  onClose: () => void;
  onSaved: (v: VehicleTypeAdmin) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [brandId, setBrandId] = useState<number | null>(
    initial?.brand ?? brands[0]?.id ?? null,
  );
  const [makeYear, setMakeYear] = useState(
    String(initial?.make_year ?? new Date().getFullYear()),
  );
  const [transmission, setTransmission] = useState(
    initial?.transmission_type ?? "AUTOMATIC",
  );
  const [vehicleTypeChoice, setVehicleTypeChoice] = useState(
    initial?.vehicle_type ?? "SCOOTER",
  );
  const [fuelType, setFuelType] = useState(initial?.fuel_type ?? "PETROL");
  const [seats, setSeats] = useState(String(initial?.seats ?? 2));
  const [cc, setCc] = useState(String(initial?.cc ?? 0));
  const [topSpeed, setTopSpeed] = useState(
    initial?.top_speed_kmph != null ? String(initial.top_speed_kmph) : "",
  );
  const [fuelCapacity, setFuelCapacity] = useState(
    initial?.fuel_capacity_litres ?? "",
  );
  const [weight, setWeight] = useState(initial?.weight_kg ?? "");
  const [mileage, setMileage] = useState(initial?.mileage_kmpl ?? "");
  const [isPublished, setIsPublished] = useState(
    initial?.is_published ?? false,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!brandId) {
      setError("Select a brand.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fields = {
      name,
      brand: brandId,
      make_year: makeYear,
      transmission_type: transmission,
      vehicle_type: vehicleTypeChoice,
      fuel_type: fuelType,
      seats,
      cc,
      top_speed_kmph: topSpeed,
      fuel_capacity_litres: fuelCapacity,
      weight_kg: weight,
      mileage_kmpl: mileage,
      is_published: isPublished,
      ...(imageFile ? { primary_image: imageFile } : {}),
    };
    const res = initial
      ? await updateVehicleTypeApi(token, initial.id, fields)
      : await createVehicleTypeApi(token, fields);
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
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 max-h-[90vh] overflow-y-auto space-y-3">
        <h3 className="font-heading font-bold text-base">
          {initial ? "Edit" : "New"} vehicle type
        </h3>

        <Field label="Photo">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {initial?.primary_image && !imageFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initial.primary_image}
              alt=""
              className="h-16 w-16 object-cover rounded-lg mt-2 border border-gray-100"
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Brand">
            <select
              value={brandId ?? ""}
              onChange={(e) => setBrandId(Number(e.target.value) || null)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Make year">
            <input
              type="number"
              value={makeYear}
              onChange={(e) => setMakeYear(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Category">
            <select
              value={vehicleTypeChoice}
              onChange={(e) => setVehicleTypeChoice(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {VEHICLE_TYPE_CHOICES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {TRANSMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Fuel type">
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Seats">
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Engine (cc)">
            <input
              type="number"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Top speed (km/h, optional)">
            <input
              type="number"
              value={topSpeed}
              onChange={(e) => setTopSpeed(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Fuel capacity (L, optional)">
            <input
              type="number"
              value={fuelCapacity}
              onChange={(e) => setFuelCapacity(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Mileage (km/l, optional)">
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        <Field label="Weight (kg, optional)">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Published (visible to customers via search)
        </label>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <div className="flex gap-3 pt-2">
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
