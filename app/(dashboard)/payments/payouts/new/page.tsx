"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getVendorsApi } from "@/services/vendors.service";
import {
  getEligibleBookingsApi,
  createPayoutApi,
} from "@/services/payments-admin.service";
import type { VendorListItem } from "@/types/vendor.types";
import type { EligibleBooking } from "@/types/payments-admin.types";

export default function NewPayoutPage() {
  const router = useRouter();
  const { token } = useAdminAuth();

  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorResults, setVendorResults] = useState<VendorListItem[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorListItem | null>(
    null,
  );

  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>(
    [],
  );
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorQuery.trim() || selectedVendor) {
      setVendorResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setVendorLoading(true);
      const res = await getVendorsApi(token!, 1, undefined, vendorQuery);
      if (res.success && res.data) setVendorResults(res.data.results);
      setVendorLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorQuery, selectedVendor, token]);

  useEffect(() => {
    if (!selectedVendor) {
      setEligibleBookings([]);
      setSelectedIds(new Set());
      return;
    }
    (async () => {
      setEligibleLoading(true);
      const res = await getEligibleBookingsApi(token!, 1, selectedVendor.id);
      if (res.success && res.data) setEligibleBookings(res.data.results);
      setEligibleLoading(false);
    })();
  }, [selectedVendor, token]);

  function toggleSelection(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(eligibleBookings.map((b) => b.id)));
  }
  function clearAll() {
    setSelectedIds(new Set());
  }

  const totalAmount = eligibleBookings
    .filter((b) => selectedIds.has(b.id))
    .reduce((sum, b) => sum + Number(b.net_amount), 0);

  async function handleSubmit() {
    if (!selectedVendor || selectedIds.size === 0) {
      setError("Select a vendor and at least one booking.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await createPayoutApi(token!, {
        vendor_id: selectedVendor.id,
        booking_ids: Array.from(selectedIds),
        period_start: periodStart || null,
        period_end: periodEnd || null,
        note,
      });
      if (!res.success || !res.data) {
        setError(res.message || "Failed to create payout");
        return;
      }
      router.push(`/payments/payouts/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.push("/payments/payouts")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to payouts
      </button>
      <h1 className="font-heading font-bold text-2xl">New Payout</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Vendor
        </label>
        {selectedVendor ? (
          <div className="flex items-center justify-between border-2 border-brand-yellow bg-brand-yellow/5 rounded-xl px-4 py-3">
            <div>
              <p className="font-semibold text-sm">
                {selectedVendor.business_name}
              </p>
              <p className="text-xs text-font-dim">
                {selectedVendor.owner_name} • {selectedVendor.phone_number}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedVendor(null);
                setVendorQuery("");
              }}
              className="text-xs font-bold text-red-500"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={vendorQuery}
              onChange={(e) => setVendorQuery(e.target.value)}
              placeholder="Search for a vendor..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
            {vendorLoading && (
              <p className="text-xs text-font-dim mt-2">Searching...</p>
            )}
            {vendorResults.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {vendorResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVendor(v);
                      setVendorResults([]);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <p className="font-medium">{v.business_name}</p>
                    <p className="text-xs text-font-dim">
                      {v.owner_name} • {v.phone_number}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedVendor && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-gray-600">
              Eligible bookings
            </label>
            {eligibleBookings.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={selectAll}
                  className="text-xs font-semibold text-brand-yellow-lg"
                >
                  Select all
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-font-dim"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {eligibleLoading ? (
            <p className="text-sm text-font-dim">
              Loading eligible bookings...
            </p>
          ) : eligibleBookings.length === 0 ? (
            <p className="text-sm text-font-dim">
              No eligible bookings for this vendor right now — every
              FULL-payment, completed booking has already been paid out.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {eligibleBookings.map((b) => (
                <label
                  key={b.id}
                  className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(b.id)}
                    onChange={() => toggleSelection(b.id)}
                    className="w-4 h-4 accent-brand-yellow shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {b.vehicle_name}
                    </p>
                    <p className="text-xs text-font-dim">
                      #{b.booking_reference} • dropped off {b.dropoff_date}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-brand-secondary shrink-0">
                    ₹{b.net_amount}
                  </p>
                </label>
              ))}
            </div>
          )}

          {selectedIds.size > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="font-semibold">{selectedIds.size} selected</span>
              <span className="font-bold text-brand-secondary">
                ₹
                {totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}{" "}
                total
              </span>
            </div>
          )}
        </div>
      )}

      {selectedVendor && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Settlement period (optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Note (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !selectedVendor || selectedIds.size === 0}
        className="w-full font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
      >
        {submitting
          ? "Creating payout..."
          : `Create payout${selectedIds.size > 0 ? ` (${selectedIds.size} bookings)` : ""}`}
      </button>
    </div>
  );
}
