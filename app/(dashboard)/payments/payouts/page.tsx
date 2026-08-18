"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getPayoutsApi } from "@/services/payments-admin.service";
import type { VendorPayoutListItem } from "@/types/payments-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PAID", label: "Paid" },
  { key: "FAILED", label: "Failed" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function PayoutsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [items, setItems] = useState<VendorPayoutListItem[]>([]);
  const [tab, setTab] = useState("");
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
        const res = await getPayoutsApi(
          token,
          targetPage,
          undefined,
          tab || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load payouts");
          return;
        }
        setItems((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payouts");
      } finally {
        setLoading(false);
      }
    },
    [token, tab],
  );

  useEffect(() => {
    setItems([]);
    load(1, true);
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Vendor Payouts</h1>
        <button
          onClick={() => router.push("/payments/payouts/new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New payout
        </button>
      </div>

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

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/payments/payouts/${p.id}`)}
            className="text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-brand-yellow transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-heading font-bold text-sm">{p.vendor_name}</p>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? "bg-gray-100"}`}
              >
                {p.status_label}
              </span>
            </div>
            <p className="text-2xl font-heading font-extrabold text-brand-secondary mt-2">
              ₹
              {Number(p.total_amount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-font-dim mt-1">
              {p.items_count} booking(s)
            </p>
            {p.utr_number && (
              <p className="text-xs text-font-dim">UTR: {p.utr_number}</p>
            )}
            <p className="text-xs text-font-dim mt-1">
              {new Date(p.created_at).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No payouts yet.
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
