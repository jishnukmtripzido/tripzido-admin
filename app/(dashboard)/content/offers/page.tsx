"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getOffersApi,
  createOfferApi,
  updateOfferApi,
  deleteOfferApi,
} from "@/services/content-admin.service";
import type { OfferAdmin } from "@/types/content-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ICON_TYPES = ["STAR", "CALCULATOR", "LIGHTNING", "BELL", "COIN"];

export default function OffersPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<OfferAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OfferAdmin | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfferAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getOffersApi(token);
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
    const res = await deleteOfferApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Offers</h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        The card with the lowest sort order automatically becomes the featured
        (yellow) card in the "Ride more, pay less" section.
      </p>

      <div className="space-y-3">
        {items.map((o) => (
          <div
            key={o.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  {o.title}
                  {!o.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-xs text-font-dim mt-0.5">{o.description}</p>
                <p className="text-xs text-font-dim mt-1">
                  {o.icon_type_label} • sort {o.sort_order}
                  {o.coupon_code && ` • code: ${o.coupon_code}`}
                  {o.discount_amount && ` • ₹${o.discount_amount} off`}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setEditing(o)}
                  className="text-xs font-bold text-brand-yellow-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(o);
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
          <p className="text-sm text-font-dim text-center py-10">
            No offers yet.
          </p>
        )}
      </div>

      {editing && (
        <OfferFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [...prev, saved]
                : prev.map((o) => (o.id === saved.id ? saved : o)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this offer?"
          message="This will permanently remove the offer card."
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

function OfferFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: OfferAdmin | null;
  onClose: () => void;
  onSaved: (o: OfferAdmin) => void;
  token: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [iconType, setIconType] = useState(initial?.icon_type ?? "STAR");
  const [couponCode, setCouponCode] = useState(initial?.coupon_code ?? "");
  const [discountAmount, setDiscountAmount] = useState(
    initial?.discount_amount ?? "",
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    initial?.min_order_amount ?? "",
  );
  const [validFrom, setValidFrom] = useState(
    initial?.valid_from?.slice(0, 16) ?? "",
  );
  const [validUntil, setValidUntil] = useState(
    initial?.valid_until?.slice(0, 16) ?? "",
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const data = {
      title,
      description,
      icon_type: iconType,
      coupon_code: couponCode,
      discount_amount: discountAmount || null,
      min_order_amount: minOrderAmount || null,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      is_active: isActive,
      sort_order: Number(sortOrder) || 0,
    };
    const res = initial
      ? await updateOfferApi(token, initial.id, data)
      : await createOfferApi(token, data);
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
          {initial ? "Edit" : "New"} offer
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <select
          value={iconType}
          onChange={(e) => setIconType(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {ICON_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Coupon code (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            placeholder="Discount ₹ (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            placeholder="Min order ₹ (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="Sort order"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Active
        </label>
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
            disabled={submitting || !title.trim()}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
