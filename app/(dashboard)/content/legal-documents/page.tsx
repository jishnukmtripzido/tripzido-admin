"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getLegalDocumentsApi,
  createLegalDocumentApi,
} from "@/services/content-admin.service";
import type { LegalDocumentAdmin } from "@/types/content-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const DOC_TABS = [
  { key: "", label: "All" },
  { key: "PLATFORM_TC", label: "Terms & Conditions" },
  { key: "PRIVACY_POLICY", label: "Privacy Policy" },
];

export default function LegalDocumentsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<LegalDocumentAdmin[]>([]);
  const [tab, setTab] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load(targetPage: number, reset: boolean) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLegalDocumentsApi(
        token,
        targetPage,
        tab || undefined,
      );
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load");
        return;
      }
      setItems((prev) =>
        reset ? res.data!.results : [...prev, ...res.data!.results],
      );
      setHasNext(res.data.pagination.next !== null);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    load(1, true);
  }, [token, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Legal Documents</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New version
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Versioned separately per document type. Marking a new version "current"
        publishes it immediately and supersedes the previous current version for
        that type — past versions stay as history.
      </p>

      <div className="flex gap-2">
        {DOC_TABS.map((t) => (
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

      <div className="space-y-2">
        {items.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
          >
            <p className="text-sm font-semibold flex items-center gap-2">
              {d.doc_type_label}
              {d.is_current && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Current
                </span>
              )}
            </p>
            <p className="text-xs text-font-dim mt-0.5">
              v{d.version}
              {d.published_at
                ? ` • published ${new Date(d.published_at).toLocaleDateString()} by ${d.published_by_name ?? "—"}`
                : " • not published"}
            </p>
            <p className="text-xs text-font-dim mt-1 line-clamp-2">
              {d.content}
            </p>
          </div>
        ))}
        {items.length === 0 && !loading && !error && (
          <p className="text-sm text-font-dim text-center py-10">
            No documents yet.
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

      {showForm && (
        <LegalDocumentFormModal
          onClose={() => setShowForm(false)}
          onSaved={(saved) => {
            setItems((prev) => [saved, ...prev]);
            setShowForm(false);
          }}
          token={token!}
        />
      )}
    </div>
  );
}

function LegalDocumentFormModal({
  onClose,
  onSaved,
  token,
}: {
  onClose: () => void;
  onSaved: (d: LegalDocumentAdmin) => void;
  token: string;
}) {
  const [docType, setDocType] = useState("PLATFORM_TC");
  const [content, setContent] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await createLegalDocumentApi(token, {
      doc_type: docType,
      content,
      is_current: isCurrent,
    });
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
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-heading font-bold text-base">
          New legal document version
        </h3>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          <option value="PLATFORM_TC">Platform Terms & Conditions</option>
          <option value="PRIVACY_POLICY">Privacy Policy</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="Document content (HTML/Markdown allowed)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none font-mono"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Publish immediately (make current)
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
