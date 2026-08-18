"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getAdminBookingsApi } from "@/services/bookings-admin.service";
import type { AdminBookingListItem } from "@/types/bookings-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PENDING_PAYMENT", label: "Pending Payment" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ONGOING", label: "Ongoing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
};

export default function BookingsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [items, setItems] = useState<AdminBookingListItem[]>([]);
  const [tab, setTab] = useState("");
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
        const res = await getAdminBookingsApi(
          token,
          targetPage,
          tab || undefined,
          search || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load bookings");
          return;
        }
        setItems((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load bookings",
        );
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

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <h1 className="font-heading font-bold text-2xl">Bookings</h1>

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
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking ref, vendor, or customer phone..."
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
        {items.map((b) => (
          <button
            key={b.id}
            onClick={() => router.push(`/bookings/${b.id}`)}
            className="text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-brand-yellow transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-heading font-bold text-sm">{b.vehicle_name}</p>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] ?? "bg-gray-100 text-gray-600"}`}
              >
                {b.status_label}
              </span>
            </div>
            <p className="text-xs text-font-dim mt-1">
              {b.vendor_name} • {b.customer_name}
            </p>
            <p className="text-xs text-font-dim mt-0.5">
              #{b.booking_reference} • {b.pickup_date} → {b.dropoff_date}
              {b.is_offline && " • Offline"}
            </p>
            <p className="text-xs font-semibold text-brand-secondary mt-1">
              ₹{b.net_amount} net
            </p>
          </button>
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No bookings found.
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
