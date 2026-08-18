"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getAdminDashboardApi } from "@/services/dashboard-admin.service";
import type { AdminDashboardData } from "@/types/dashboard-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED: "Confirmed",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PAYMENT_FAILED: "Payment Failed",
  EXPIRED: "Expired",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
};

function currency(value: string | number) {
  return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboardApi(token);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load dashboard");
        return;
      }
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;
  if (error || !data)
    return (
      <p className="text-sm text-red-500 text-center py-10">
        {error || "Failed to load dashboard"}
      </p>
    );

  const maxBar = Math.max(...data.weekly_booking_bars, 1);
  const dayLabels = (() => {
    const labels: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return labels;
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Dashboard</h1>
        <p className="text-xs text-font-dim">{data.range_label}</p>
      </div>

      {(data.pending_vendor_approvals > 0 ||
        data.pending_listing_approvals > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.pending_vendor_approvals > 0 && (
            <button
              onClick={() => router.push("/vendors/approvals")}
              className="text-left bg-yellow-50 border border-yellow-200 rounded-2xl p-4 hover:border-yellow-400 transition-colors"
            >
              <p className="text-2xl font-heading font-extrabold text-yellow-800">
                {data.pending_vendor_approvals}
              </p>
              <p className="text-sm font-semibold text-yellow-800 mt-1">
                Vendor approval{data.pending_vendor_approvals !== 1 ? "s" : ""}{" "}
                pending
              </p>
            </button>
          )}
          {data.pending_listing_approvals > 0 && (
            <button
              onClick={() => router.push("/listings/approvals")}
              className="text-left bg-yellow-50 border border-yellow-200 rounded-2xl p-4 hover:border-yellow-400 transition-colors"
            >
              <p className="text-2xl font-heading font-extrabold text-yellow-800">
                {data.pending_listing_approvals}
              </p>
              <p className="text-sm font-semibold text-yellow-800 mt-1">
                Listing approval
                {data.pending_listing_approvals !== 1 ? "s" : ""} pending
              </p>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Platform Revenue (This month)"
          value={currency(data.revenue_this_month)}
          trendPct={data.revenue_trend_pct}
          lastLabel="Last month"
          lastValue={currency(data.revenue_last_month)}
        />
        <StatCard
          label="Bookings (This month)"
          value={String(data.bookings_this_month)}
          trendPct={data.bookings_trend_pct}
          lastLabel="Last month"
          lastValue={String(data.bookings_last_month)}
        />
        <StatCard
          label="Active Vendors"
          value={String(data.active_vendors)}
          trendPct={data.vendors_trend_pct}
          lastLabel="New this month"
          lastValue={String(data.vendors_this_month)}
        />
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-font-dim font-medium">Total Customers</p>
          <p className="text-2xl font-heading font-extrabold text-font-main-sub mt-1">
            {data.total_customers}
          </p>
          <button
            onClick={() => router.push("/customers")}
            className="text-xs font-semibold text-brand-yellow-lg mt-3"
          >
            View all →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-sm mb-4">
          Bookings — last 7 days
        </h2>
        <div className="h-32 flex items-end justify-between gap-2">
          {data.weekly_booking_bars.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                style={{ height: `${Math.max((count / maxBar) * 100, 4)}%` }}
                className="w-full bg-brand-yellow rounded-t-sm transition-all"
              />
              <span className="text-[10px] text-font-dim">{count}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-font-dim font-medium">
          {dayLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push("/payments/payouts?status=PENDING")}
        className="w-full text-left bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-brand-yellow transition-colors flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-font-dim font-medium">
            Pending Vendor Payouts
          </p>
          <p className="text-2xl font-heading font-extrabold text-font-main-sub mt-1">
            {currency(data.pending_payout_amount)}
          </p>
          <p className="text-xs text-font-dim mt-0.5">
            {data.pending_payout_count} payout(s) awaiting transfer
          </p>
        </div>
        <span className="text-xs font-semibold text-brand-yellow-lg">
          View →
        </span>
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-heading font-bold text-sm mb-3">
          Bookings by status
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.booking_status_counts).map(
            ([statusKey, count]) => (
              <span
                key={statusKey}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${BOOKING_STATUS_STYLES[statusKey] ?? "bg-gray-100 text-gray-600"}`}
              >
                {BOOKING_STATUS_LABELS[statusKey] ?? statusKey}: {count}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-base">Recent bookings</h2>
          <button
            onClick={() => router.push("/bookings")}
            className="text-xs font-semibold text-brand-yellow-lg"
          >
            See all →
          </button>
        </div>
        <div className="space-y-2">
          {data.recent_bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => router.push(`/bookings/${b.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:border-brand-yellow transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {b.vehicle_name}
                </p>
                <p className="text-xs text-font-dim truncate">
                  {b.vendor_name} • {b.customer_name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS_STYLES[b.status] ?? "bg-gray-100"}`}
                >
                  {b.status_label}
                </span>
                <p className="text-xs font-semibold text-brand-secondary mt-1">
                  ₹{b.net_amount}
                </p>
              </div>
            </button>
          ))}
          {data.recent_bookings.length === 0 && (
            <p className="text-sm text-font-dim text-center py-6">
              No bookings yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trendPct,
  lastLabel,
  lastValue,
}: {
  label: string;
  value: string;
  trendPct: number;
  lastLabel: string;
  lastValue: string;
}) {
  const positive = trendPct >= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex justify-between items-start mb-1">
        <p className="text-sm text-font-dim font-medium">{label}</p>
        <div
          className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${positive ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}
        >
          <svg
            className={`w-3 h-3 mr-1 ${positive ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          {Math.abs(trendPct)}%
        </div>
      </div>
      <h3 className="text-2xl font-heading font-extrabold text-font-main-sub mb-3">
        {value}
      </h3>
      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
        <p className="text-xs text-gray-400 font-medium">{lastLabel}</p>
        <p className="text-sm font-bold text-gray-500">{lastValue}</p>
      </div>
    </div>
  );
}
