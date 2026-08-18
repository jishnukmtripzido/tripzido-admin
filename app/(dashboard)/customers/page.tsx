"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getCustomersApi } from "@/services/users-admin.service";
import type { AdminCustomerListItem } from "@/types/users-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  BANNED: "bg-gray-800 text-white",
  PENDING_DELETION: "bg-yellow-100 text-yellow-700",
  DELETED: "bg-red-100 text-red-700",
};

export default function CustomersPage() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [items, setItems] = useState<AdminCustomerListItem[]>([]);
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
        const res = await getCustomersApi(
          token,
          targetPage,
          search || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load customers");
          return;
        }
        setItems((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load customers",
        );
      } finally {
        setLoading(false);
      }
    },
    [token, search],
  );

  useEffect(() => {
    load(1, true);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setItems([]);
    load(1, true);
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="font-heading font-bold text-2xl">Customers</h1>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone, name, or email..."
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
        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/customers/${c.id}`)}
            className="text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-brand-yellow transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-heading font-bold text-sm">{c.full_name}</p>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-600"}`}
              >
                {c.status_label}
              </span>
            </div>
            <p className="text-xs text-font-dim mt-1">{c.phone_number}</p>
            <p className="text-xs text-font-dim">{c.email || "no email"}</p>
          </button>
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No customers found.
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
