"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getReviewsApi,
  updateReviewStatusApi,
  deleteReviewApi,
} from "@/services/reviews-admin.service";
import type { AdminReviewListItem } from "@/types/reviews-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "FLAGGED", label: "Flagged" },
  { key: "REMOVED", label: "Removed" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  FLAGGED: "bg-orange-100 text-orange-700",
  REMOVED: "bg-gray-200 text-gray-600",
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending Moderation" },
  { value: "APPROVED", label: "Approved – Visible" },
  { value: "FLAGGED", label: "Flagged for Review" },
  { value: "REMOVED", label: "Removed by Admin" },
];

function StarRating({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-xs text-gray-400">No rating</span>;
  return (
    <span className="text-sm font-bold text-brand-secondary">
      ★ {value.toFixed(1)}
    </span>
  );
}

export default function ReviewsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<AdminReviewListItem[]>([]);
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<AdminReviewListItem | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState("");
  const [moderationNote, setModerationNote] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminReviewListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, reset: boolean) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getReviewsApi(
          token,
          targetPage,
          tab || undefined,
          search || undefined,
        );
        if (!res.success || !res.data) {
          setError(res.message || "Failed to load reviews");
          return;
        }
        setItems((prev) =>
          reset ? res.data!.results : [...prev, ...res.data!.results],
        );
        setHasNext(res.data.pagination.next !== null);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
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

  function openStatusModal(review: AdminReviewListItem) {
    setStatusTarget(review);
    setNewStatus(review.moderation_status);
    setModerationNote("");
    setStatusError(null);
  }

  async function handleConfirmStatus() {
    if (!statusTarget || !token) return;
    setStatusSubmitting(true);
    setStatusError(null);
    try {
      const res = await updateReviewStatusApi(
        token,
        statusTarget.id,
        newStatus,
        moderationNote,
      );
      if (!res.success || !res.data) {
        setStatusError(res.message || "Failed to update status");
        return;
      }
      setItems((prev) =>
        prev.map((r) =>
          r.id === statusTarget.id
            ? {
                ...r,
                moderation_status: res.data!.moderation_status,
                moderation_status_label: res.data!.moderation_status_label,
              }
            : r,
        ),
      );
      setStatusTarget(null);
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteReviewApi(token, deleteTarget.id);
      if (!res.success) {
        setDeleteError(res.message || "Failed to delete review");
        return;
      }
      setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete review",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="font-heading font-bold text-2xl">Reviews</h1>

      <div className="flex gap-2 flex-wrap">
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
          placeholder="Search by booking ref, customer phone, vendor, or vehicle..."
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
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                  {r.vehicle_name}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      STATUS_STYLES[r.moderation_status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.moderation_status_label}
                  </span>
                </p>
                <p className="text-xs text-font-dim mt-0.5">
                  {r.customer_name} • via {r.vendor_name}
                </p>
                {r.review_text && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {r.review_text}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-2">
                <StarRating value={r.average_rating} />
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => openStatusModal(r)}
                    className="text-xs font-bold text-brand-yellow-lg"
                  >
                    Change status
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget(r);
                      setDeleteError(null);
                    }}
                    className="text-xs font-bold text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && !error && (
          <p className="text-sm text-font-dim text-center py-10">
            No reviews found.
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

      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setStatusTarget(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
            <h3 className="font-heading font-bold text-base">
              Change review status
            </h3>
            <p className="text-sm text-font-dim">
              {statusTarget.vehicle_name} — {statusTarget.customer_name}
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <textarea
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              rows={2}
              placeholder="Moderation note (optional, internal only)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
            {statusError && (
              <p className="text-sm text-red-500 font-medium">{statusError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStatusTarget(null)}
                disabled={statusSubmitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatus}
                disabled={statusSubmitting}
                className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
              >
                {statusSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this review?"
          message={`This permanently removes ${deleteTarget.customer_name}'s review of ${deleteTarget.vehicle_name}. This can't be undone.`}
          confirmLabel="Delete"
          destructive
          submitting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
