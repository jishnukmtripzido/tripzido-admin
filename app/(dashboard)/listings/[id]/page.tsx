"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getListingDetailApi,
  updateListingStatusApi,
} from "@/services/listings.service";
import type {
  AdminListingDetail,
  AdminListingStatus,
} from "@/types/listing-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["SUSPENDED"],
  PAUSED: ["SUSPENDED"],
  SUSPENDED: ["APPROVED"],
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  PAUSED: "bg-gray-100 text-gray-600",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const ACTION_LABELS: Record<string, string> = {
  APPROVED: "Approve",
  REJECTED: "Reject",
  SUSPENDED: "Suspend",
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAdminAuth();
  const listingId = Number(params.id);

  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getListingDetailApi(token, listingId);
      if (!res.success || !res.data) {
        setError(res.message || "Listing not found");
        return;
      }
      setListing(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, listingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;
  if (error || !listing)
    return (
      <p className="text-sm text-red-500 text-center py-10">
        {error || "Listing not found"}
      </p>
    );

  const options = ALLOWED_TRANSITIONS[listing.status] ?? [];
  const reasonRequired = target === "REJECTED" || target === "SUSPENDED";

  async function handleConfirm() {
    if (!target || !token) return;
    if (reasonRequired && !reason.trim()) {
      setActionError("A reason is required for this action.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await updateListingStatusApi(
        token,
        listingId,
        target as AdminListingStatus,
        reason,
      );
      if (!res.success || !res.data) {
        setActionError(res.message || "Failed to update");
        return;
      }
      setListing(res.data);
      setTarget(null);
      setReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.push("/listings")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to listings
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
            {listing.vehicle_type_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.vehicle_type_image}
                alt={listing.vehicle_type_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-300">No image</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="font-heading font-bold text-lg">
                {listing.vehicle_type_name}
              </h1>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[listing.status] ?? "bg-gray-100"}`}
              >
                {listing.status}
              </span>
            </div>
            <p className="text-sm text-font-dim mt-1">
              Vendor: {listing.vendor_name}
            </p>
            <p className="text-sm text-font-dim">
              {listing.pickup_location_name}
              {listing.pickup_point_address
                ? ` — ${listing.pickup_point_address}`
                : ""}
            </p>
          </div>
        </div>

        {listing.rejection_reason && (
          <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg p-3">
            Rejected: {listing.rejection_reason}
          </p>
        )}
        {listing.suspension_reason && listing.status === "SUSPENDED" && (
          <p className="text-sm text-orange-600 mt-3 bg-orange-50 rounded-lg p-3">
            Suspended: {listing.suspension_reason}
          </p>
        )}

        {options.length > 0 && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setTarget(opt);
                  setReason("");
                  setActionError(null);
                }}
                className={`text-sm font-bold px-4 py-2 rounded-lg ${
                  opt === "APPROVED"
                    ? "bg-brand-yellow text-brand-secondary"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {ACTION_LABELS[opt]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-sm mb-3">
          Photos ({listing.images.length})
        </h2>
        {listing.images.length === 0 ? (
          <p className="text-sm text-font-dim">No photos uploaded.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto">
            {listing.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.image_url ?? undefined}
                alt=""
                className="h-24 w-24 rounded-xl object-cover border border-gray-100 shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-sm mb-3">
          Pricing Packages ({listing.pricing_packages.length})
        </h2>
        <div className="space-y-2">
          {listing.pricing_packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex justify-between text-sm border-b border-gray-50 pb-2"
            >
              <span>
                {pkg.name} ({pkg.category}, {pkg.duration_hours}h)
              </span>
              <span className="font-bold">₹{pkg.price}</span>
            </div>
          ))}
          {listing.pricing_packages.length === 0 && (
            <p className="text-sm text-font-dim">No pricing packages set up.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-sm mb-3">
          Schedule{" "}
          {listing.schedule_template_name
            ? `— ${listing.schedule_template_name}`
            : ""}
        </h2>
        {listing.schedule_days.length === 0 ? (
          <p className="text-sm text-font-dim">No schedule assigned.</p>
        ) : (
          <div className="space-y-1">
            {listing.schedule_days.map((d) => (
              <div key={d.day_of_week} className="flex justify-between text-sm">
                <span>
                  {
                    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                      d.day_of_week
                    ]
                  }
                </span>
                <span
                  className={d.is_closed ? "text-red-500" : "text-font-dim"}
                >
                  {d.timing}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-sm mb-3">Policies</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-font-dim">Fleet size</span>
            <span>{listing.available_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-font-dim">Security deposit</span>
            <span>₹{listing.security_deposit_amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-font-dim">Km limit/day</span>
            <span>{listing.km_limit_per_day ?? "No limit"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-font-dim">Excess charge/km</span>
            <span>
              {listing.excess_charge_per_km
                ? `₹${listing.excess_charge_per_km}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-font-dim">Late return penalty/hr</span>
            <span>
              {listing.late_return_penalty_per_hour
                ? `₹${listing.late_return_penalty_per_hour}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-font-dim">Doorstep delivery</span>
            <span>
              {listing.doorstep_delivery_enabled ? "Enabled" : "Not enabled"}
            </span>
          </div>
        </div>
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setTarget(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
            <h3 className="font-heading font-bold text-base mb-2">
              {ACTION_LABELS[target]} this listing?
            </h3>
            {reasonRequired && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            )}
            {actionError && (
              <p className="text-sm text-red-500 font-medium mt-2">
                {actionError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setTarget(null)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-red-500 disabled:opacity-50"
              >
                {submitting ? "Please wait..." : ACTION_LABELS[target]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
