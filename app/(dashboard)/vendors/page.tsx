"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getVendorsApi } from "@/services/vendors.service";
import type { VendorListItem, VendorStatus } from "@/types/vendor.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_TABS: { key: VendorStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "SUSPENDED", label: "Suspended" },
  { key: "REJECTED", label: "Rejected" },
  { key: "BANNED", label: "Banned" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  BANNED: "bg-gray-800 text-white",
};

export default function VendorsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [tab, setTab] = useState<VendorStatus | "ALL">("ALL");
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
        const res = await getVendorsApi(
          token,
          targetPage,
          tab === "ALL" ? undefined : tab,
          search || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load vendors");
          return;
        }
        setVendors((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load vendors");
      } finally {
        setLoading(false);
      }
    },
    [token, tab, search],
  );

  useEffect(() => {
    setVendors([]);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVendors([]);
    load(1, true);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <h1 className="font-heading font-bold text-2xl">Vendors</h1>

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
          placeholder="Search by business name, owner, email, or phone..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-yellow"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-secondary text-sm font-bold"
        >
          Search
        </button>
      </form>

      {loading && vendors.length === 0 ? (
        <PageLoader />
      ) : (
        <>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <button
                key={v.id}
                onClick={() => router.push(`/vendors/${v.id}`)}
                className="text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-brand-yellow transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-bold text-sm">
                    {v.business_name}
                  </h3>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[v.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {v.status_label}
                  </span>
                </div>
                <p className="text-xs text-font-dim mt-1">{v.owner_name}</p>
                <p className="text-xs text-font-dim mt-0.5">
                  {v.phone_number} • {v.email || "no email"}
                </p>
              </button>
            ))}
          </div>

          {vendors.length === 0 && !loading && !error && (
            <p className="text-sm text-font-dim text-center py-10">
              No vendors found.
            </p>
          )}
          {loading && vendors.length > 0 && <InlineLoader />}
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
