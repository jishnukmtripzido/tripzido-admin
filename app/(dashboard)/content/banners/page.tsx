"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getBannersApi,
  createBannerApi,
  updateBannerApi,
  deleteBannerApi,
} from "@/services/content-admin.service";
import type { AnnouncementBannerAdmin } from "@/types/content-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const PAGES = [
  { value: "home", label: "Home Page" },
  { value: "search_result", label: "Search Result Page" },
  { value: "vehicle_detail", label: "Vehicle Detail Page" },
];

export default function BannersPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<AnnouncementBannerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<
    AnnouncementBannerAdmin | "new" | null
  >(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AnnouncementBannerAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getBannersApi(token);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteBannerApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">
          Announcement Banners
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Content accepts raw HTML (bold, links, etc.) — this form is a plain text
        box, not a rich text editor, so type HTML tags directly if needed. Only
        one banner per page can be marked "Current" at a time; setting a new one
        current automatically un-sets the previous one for that page.
      </p>

      <div className="space-y-3">
        {items.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                  {b.page_label}
                  {b.is_current && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Current
                    </span>
                  )}
                  {!b.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-xs text-font-dim mt-1 line-clamp-2">
                  {b.content}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setEditing(b)}
                  className="text-xs font-bold text-brand-yellow-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(b);
                    setDeleteError(null);
                  }}
                  className="text-xs font-bold text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-font-dim text-center py-10">
            No banners yet.
          </p>
        )}
      </div>

      {editing && (
        <BannerFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [...prev, saved]
                : prev.map((b) => (b.id === saved.id ? saved : b)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this banner?"
          message="This will permanently remove it."
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

function BannerFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: AnnouncementBannerAdmin | null;
  onClose: () => void;
  onSaved: (b: AnnouncementBannerAdmin) => void;
  token: string;
}) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [page, setPage] = useState(initial?.page ?? "home");
  const [isCurrent, setIsCurrent] = useState(initial?.is_current ?? true);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const data = { content, page, is_current: isCurrent, is_active: isActive };
    const res = initial
      ? await updateBannerApi(token, initial.id, data)
      : await createBannerApi(token, data);
    if (!res.success || !res.data) {
      setError(res.message || "Failed to save");
      setSubmitting(false);
      return;
    }
    onSaved(res.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">
          {initial ? "Edit" : "New"} banner
        </h3>
        <select
          value={page}
          onChange={(e) => setPage(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {PAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Banner content (HTML allowed)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none font-mono"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Make this the current banner for this page
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Active
        </label>
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
