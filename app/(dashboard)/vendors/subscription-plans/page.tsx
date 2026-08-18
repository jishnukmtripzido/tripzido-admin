"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getSubscriptionPlansApi,
  createSubscriptionPlanApi,
  updateSubscriptionPlanApi,
  deleteSubscriptionPlanApi,
  getCommissionsApi,
} from "@/services/vendors.service";
import type { SubscriptionPlan, VendorCommission } from "@/types/vendor.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"];

export default function SubscriptionPlansPage() {
  const { token } = useAdminAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [commissions, setCommissions] = useState<VendorCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubscriptionPlan | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const [plansRes, commissionsRes] = await Promise.all([
      getSubscriptionPlansApi(token),
      getCommissionsApi(token),
    ]);
    if (plansRes.success && plansRes.data) setPlans(plansRes.data);
    if (commissionsRes.success && commissionsRes.data)
      setCommissions(commissionsRes.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteSubscriptionPlanApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading) return <PageLoader />;

  if (commissions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="font-heading font-bold text-2xl">Subscription Plans</h1>
        <p className="text-sm text-font-dim bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          You need at least one commission structure before creating a plan. Go
          to{" "}
          <a
            href="/vendors/commissions"
            className="font-semibold text-brand-yellow-lg underline"
          >
            Commission Structures
          </a>{" "}
          and add one first.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Subscription Plans</h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-heading font-bold text-sm flex items-center gap-2">
                  {p.name}
                  {p.is_default && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-xs text-font-dim mt-0.5">
                  {p.billing_cycle} • ₹{p.price}
                </p>
                <p className="text-xs text-font-dim">
                  Commission: {p.commission_name}
                </p>
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
            <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-font-dim space-y-1">
              <p>Max listings: {p.max_listings ?? "Unlimited"}</p>
              <p>
                Max pickup locations: {p.max_pickup_locations ?? "Unlimited"}
              </p>
              <p>Max images/listing: {p.max_images_per_listing}</p>
              <p>
                {[
                  p.can_enable_partial_payment && "Partial payment",
                  p.can_access_analytics && "Analytics",
                  p.can_respond_to_reviews && "Review replies",
                  p.priority_listing && "Priority listing",
                ]
                  .filter(Boolean)
                  .join(" • ") || "No extra features"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <p className="text-sm text-font-dim text-center py-10">No plans yet.</p>
      )}

      {editing && (
        <PlanFormModal
          initial={editing === "new" ? null : editing}
          commissions={commissions}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setPlans((prev) =>
              editing === "new"
                ? [...prev, saved]
                : prev.map((p) => (p.id === saved.id ? saved : p)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this plan?"
          message="If any vendor is or has ever been subscribed to this plan, deletion will be blocked."
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

function PlanFormModal({
  initial,
  commissions,
  onClose,
  onSaved,
  token,
}: {
  initial: SubscriptionPlan | null;
  commissions: VendorCommission[];
  onClose: () => void;
  onSaved: (p: SubscriptionPlan) => void;
  token: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [billingCycle, setBillingCycle] = useState(
    initial?.billing_cycle ?? "MONTHLY",
  );
  const [price, setPrice] = useState(initial?.price ?? "");
  const [commissionId, setCommissionId] = useState<number | null>(
    initial?.commission ?? commissions[0]?.id ?? null,
  );
  const [maxListings, setMaxListings] = useState(
    initial?.max_listings != null ? String(initial.max_listings) : "",
  );
  const [maxPickupLocations, setMaxPickupLocations] = useState(
    initial?.max_pickup_locations != null
      ? String(initial.max_pickup_locations)
      : "",
  );
  const [maxImages, setMaxImages] = useState(
    String(initial?.max_images_per_listing ?? 10),
  );
  const [canPartialPayment, setCanPartialPayment] = useState(
    initial?.can_enable_partial_payment ?? true,
  );
  const [canAnalytics, setCanAnalytics] = useState(
    initial?.can_access_analytics ?? false,
  );
  const [canRespondReviews, setCanRespondReviews] = useState(
    initial?.can_respond_to_reviews ?? true,
  );
  const [priorityListing, setPriorityListing] = useState(
    initial?.priority_listing ?? false,
  );
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false);
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!commissionId) {
      setError("Select a commission structure.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const data = {
      name,
      description,
      billing_cycle: billingCycle,
      price,
      commission: commissionId,
      max_listings: maxListings ? Number(maxListings) : null,
      max_pickup_locations: maxPickupLocations
        ? Number(maxPickupLocations)
        : null,
      max_images_per_listing: Number(maxImages) || 10,
      can_enable_partial_payment: canPartialPayment,
      can_access_analytics: canAnalytics,
      can_respond_to_reviews: canRespondReviews,
      priority_listing: priorityListing,
      is_default: isDefault,
      sort_order: Number(sortOrder) || 0,
    };
    const res = initial
      ? await updateSubscriptionPlanApi(token, initial.id, data)
      : await createSubscriptionPlanApi(token, data);
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
          {initial ? "Edit" : "New"} subscription plan
        </h3>

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Growth"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Billing cycle">
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (₹)">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        <Field label="Commission structure">
          <select
            value={commissionId ?? ""}
            onChange={(e) => setCommissionId(Number(e.target.value) || null)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            {commissions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.flat_percentage}%)
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Max listings">
            <input
              type="number"
              value={maxListings}
              onChange={(e) => setMaxListings(e.target.value)}
              placeholder="Unlimited"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Max pickup pts">
            <input
              type="number"
              value={maxPickupLocations}
              onChange={(e) => setMaxPickupLocations(e.target.value)}
              placeholder="Unlimited"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Max images">
            <input
              type="number"
              value={maxImages}
              onChange={(e) => setMaxImages(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        <div className="space-y-2">
          <Checkbox
            label="Allow partial payment at checkout"
            checked={canPartialPayment}
            onChange={setCanPartialPayment}
          />
          <Checkbox
            label="Access to analytics"
            checked={canAnalytics}
            onChange={setCanAnalytics}
          />
          <Checkbox
            label="Can respond to reviews"
            checked={canRespondReviews}
            onChange={setCanRespondReviews}
          />
          <Checkbox
            label="Priority listing placement"
            checked={priorityListing}
            onChange={setPriorityListing}
          />
          <Checkbox
            label="Auto-assign to new vendors as default plan"
            checked={isDefault}
            onChange={setIsDefault}
          />
        </div>

        <Field label="Sort order (lower = shown first)">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>

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
            disabled={submitting || !name.trim() || !price}
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

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-brand-yellow"
      />
      {label}
    </label>
  );
}
