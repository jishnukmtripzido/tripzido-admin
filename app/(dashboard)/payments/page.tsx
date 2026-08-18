"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getAdminPaymentsApi,
  toggleReconciledApi,
} from "@/services/payments-admin.service";
import type { AdminPayment } from "@/types/payments-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "SUCCESS", label: "Success" },
  { key: "PENDING", label: "Pending" },
  { key: "FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
];

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  INITIATED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
  PARTIALLY_REFUNDED: "bg-blue-100 text-blue-700",
};

export default function PaymentsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [tab, setTab] = useState("");
  const [unreconciledOnly, setUnreconciledOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, reset: boolean) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminPaymentsApi(
          token,
          targetPage,
          tab || undefined,
          search || undefined,
          unreconciledOnly ? false : undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load payments");
          return;
        }
        setItems((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payments",
        );
      } finally {
        setLoading(false);
      }
    },
    [token, tab, search, unreconciledOnly],
  );

  useEffect(() => {
    setItems([]);
    load(1, true);
  }, [tab, unreconciledOnly, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setItems([]);
    load(1, true);
  }

  async function handleToggle(id: number) {
    if (!token) return;
    const res = await toggleReconciledApi(token, id);
    if (res.success && res.data) {
      setItems((prev) => prev.map((p) => (p.id === id ? res.data! : p)));
    }
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="font-heading font-bold text-2xl">Payments</h1>

      <div className="flex flex-wrap gap-2">
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
        <button
          onClick={() => setUnreconciledOnly((v) => !v)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
            unreconciledOnly
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Unreconciled only
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by gateway order/payment id or booking ref..."
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
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                #{p.booking_reference}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? "bg-gray-100"}`}
                >
                  {p.status_label}
                </span>
                {!p.is_reconciled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    Unreconciled
                  </span>
                )}
              </p>
              <p className="text-xs text-font-dim">
                {p.vendor_name} • {p.payment_type_label} • ₹{p.amount}
              </p>
              <p className="text-xs text-font-dim truncate">
                {p.gateway_order_id}
                {p.gateway_payment_id ? ` / ${p.gateway_payment_id}` : ""}
              </p>
              {p.failure_reason && (
                <p className="text-xs text-red-500 mt-0.5">
                  {p.failure_reason}
                </p>
              )}
            </div>
            <button
              onClick={() => handleToggle(p.id)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg ${
                p.is_reconciled
                  ? "bg-gray-100 text-gray-600"
                  : "bg-brand-yellow text-brand-secondary"
              }`}
            >
              {p.is_reconciled ? "Unmark reconciled" : "Mark reconciled"}
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No payments found.
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
    </div>
  );
}
