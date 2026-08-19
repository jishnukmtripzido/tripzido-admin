"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getRefundsApi,
  updateRefundStatusApi,
} from "@/services/refunds-admin.service";
import type { RefundRecord } from "@/types/refunds-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSED", label: "Refunded" },
  { key: "FAILED", label: "Failed" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function RefundsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<RefundRecord[]>([]);
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionTarget, setActionTarget] = useState<{
    refund: RefundRecord;
    status: "PROCESSED" | "FAILED";
  } | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, reset: boolean) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getRefundsApi(
          token,
          targetPage,
          tab || undefined,
          search || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load refunds");
          return;
        }
        setItems((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load refunds");
      } finally {
        setLoading(false);
      }
    },
    [token, tab, search],
  );

  useEffect(() => {
    setItems([]);
    load(1, true);
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setItems([]);
    load(1, true);
  }

  async function handleConfirmAction() {
    if (!actionTarget || !token) return;
    if (actionTarget.status === "PROCESSED" && !referenceNumber.trim()) {
      setActionError(
        "A reference number is required to mark this refund as processed.",
      );
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await updateRefundStatusApi(token, actionTarget.refund.id, {
        status: actionTarget.status,
        reference_number: referenceNumber,
        note,
      });
      if (!res.success || !res.data) {
        setActionError(res.message || "Failed to update");
        return;
      }
      setItems((prev) =>
        prev.map((r) => (r.id === res.data!.id ? res.data! : r)),
      );
      setActionTarget(null);
      setReferenceNumber("");
      setNote("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="font-heading font-bold text-2xl">Refunds</h1>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        A refund record is created automatically whenever a booking is cancelled
        with money owed back. This is a tracking tool only — process the actual
        refund through Cashfree&rsquo;s dashboard or a bank transfer, then mark
        it here with a reference number. Automatic gateway refunds aren&rsquo;t
        wired up yet.
      </p>

      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              tab === t.key
                ? "bg-brand-yellow text-brand-secondary"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking ref, customer phone, or vendor..."
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

      <div className="space-y-2">
        {items.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                  #{r.booking_reference}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status_label}
                  </span>
                </p>
                <p className="text-xs text-font-dim mt-0.5">
                  {r.customer_name} • {r.customer_phone} • via {r.vendor_name}
                </p>
                <p className="text-xs text-font-dim">
                  Reason: {r.reason_label} • Cancelled{" "}
                  {new Date(r.cancelled_at).toLocaleDateString()}
                </p>
                {r.reference_number && (
                  <p className="text-xs text-font-dim">
                    Ref: {r.reference_number}
                  </p>
                )}
                {r.processed_by_name && (
                  <p className="text-xs text-font-dim">
                    Processed by {r.processed_by_name}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-heading font-extrabold text-brand-secondary">
                  ₹{r.amount}
                </p>
                {r.status === "PENDING" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setActionTarget({ refund: r, status: "PROCESSED" });
                        setReferenceNumber("");
                        setNote("");
                        setActionError(null);
                      }}
                      className="text-xs font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg"
                    >
                      Mark refunded
                    </button>
                    <button
                      onClick={() => {
                        setActionTarget({ refund: r, status: "FAILED" });
                        setReferenceNumber("");
                        setNote("");
                        setActionError(null);
                      }}
                      className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
                    >
                      Mark failed
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && !error && (
          <p className="text-sm text-font-dim text-center py-10">
            No refunds found.
          </p>
        )}
      </div>

      {loading && items.length > 0 && <InlineLoader />}
      {hasNext && !loading && (
        <button
          onClick={() => load(page + 1, false)}
          className="w-full text-sm font-semibold text-brand-yellow-lg py-2"
        >
          Load more
        </button>
      )}

      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setActionTarget(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
            <h3 className="font-heading font-bold text-base">
              {actionTarget.status === "PROCESSED"
                ? "Mark this refund as processed?"
                : "Mark this refund as failed?"}
            </h3>
            <p className="text-sm text-font-dim">
              ₹{actionTarget.refund.amount} to{" "}
              {actionTarget.refund.customer_name}
            </p>
            {actionTarget.status === "PROCESSED" && (
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Refund reference / transaction number"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Note (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
            {actionError && (
              <p className="text-sm text-red-500 font-medium">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setActionTarget(null)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-50 ${
                  actionTarget.status === "FAILED"
                    ? "text-white bg-red-500"
                    : "bg-brand-yellow text-brand-secondary"
                }`}
              >
                {submitting ? "Please wait..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
