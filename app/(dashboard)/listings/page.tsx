"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getListingsApi } from "@/services/listings.service";
import type {
  AdminListingListItem,
  AdminListingStatus,
} from "@/types/listing-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_TABS: { key: AdminListingStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "PAUSED", label: "Paused" },
  { key: "SUSPENDED", label: "Suspended" },
  { key: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  PAUSED: "bg-gray-100 text-gray-600",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ListingsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [listings, setListings] = useState<AdminListingListItem[]>([]);
  const [tab, setTab] = useState<AdminListingStatus | "ALL">("ALL");
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
        const res = await getListingsApi(
          token,
          targetPage,
          tab === "ALL" ? undefined : tab,
          search || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load listings");
          return;
        }
        setListings((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listings",
        );
      } finally {
        setLoading(false);
      }
    },
    [token, tab, search],
  );

  useEffect(() => {
    setListings([]);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setListings([]);
    load(1, true);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <h1 className="font-heading font-bold text-2xl">Listings</h1>

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
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vehicle, brand, or vendor..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-yellow"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-secondary text-sm font-bold"
        >
          Search
        </button>
      </form>

      {loading && listings.length === 0 ? (
        <PageLoader />
      ) : (
        <>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((l) => (
              <button
                key={l.id}
                onClick={() => router.push(`/listings/${l.id}`)}
                className="text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-brand-yellow transition-colors flex gap-3"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {l.vehicle_type_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.vehicle_type_image}
                      alt={l.vehicle_type_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-300">No image</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-sm truncate">
                      {l.vehicle_type_name}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[l.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {l.status_label}
                    </span>
                  </div>
                  <p className="text-xs text-font-dim mt-1 truncate">
                    {l.vendor_name}
                  </p>
                  <p className="text-xs text-font-dim mt-0.5">
                    {l.location_name} • {l.quantity} units
                  </p>
                </div>
              </button>
            ))}
          </div>

          {listings.length === 0 && !loading && !error && (
            <p className="text-sm text-font-dim text-center py-10">
              No listings found.
            </p>
          )}
          {loading && listings.length > 0 && <InlineLoader />}
          {hasNext && !loading && (
            <button
              onClick={() => load(page + 1, false)}
              className="w-full text-sm font-semibold text-brand-yellow-lg py-2"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
