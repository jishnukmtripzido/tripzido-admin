// "use client";

// import { useEffect, useState } from "react";
// import { useAdminAuth } from "@/context/AdminAuthContext";
// import {
//   getLegalDocumentsApi,
//   createLegalDocumentApi,
// } from "@/services/content-admin.service";
// import type { LegalDocumentAdmin } from "@/types/content-admin.types";
// import { PageLoader } from "@/components/ui/PageLoader";
// import { InlineLoader } from "@/components/ui/InLineLoader";

// const DOC_TABS = [
//   { key: "", label: "All" },
//   { key: "PLATFORM_TC", label: "Terms & Conditions" },
//   { key: "PRIVACY_POLICY", label: "Privacy Policy" },
// ];

// export default function LegalDocumentsPage() {
//   const { token } = useAdminAuth();
//   const [items, setItems] = useState<LegalDocumentAdmin[]>([]);
//   const [tab, setTab] = useState("");
//   const [page, setPage] = useState(1);
//   const [hasNext, setHasNext] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showForm, setShowForm] = useState(false);
//   const [viewTarget, setViewTarget] = useState<LegalDocumentAdmin | null>(null);

//   async function load(targetPage: number, reset: boolean) {
//     if (!token) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await getLegalDocumentsApi(
//         token,
//         targetPage,
//         tab || undefined,
//       );
//       if (!res.success || !res.data) {
//         setError(res.message || "Failed to load");
//         return;
//       }
//       setItems((prev) =>
//         reset ? res.data!.results : [...prev, ...res.data!.results],
//       );
//       setHasNext(res.data.pagination.next !== null);
//       setPage(targetPage);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to load");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     setItems([]);
//     load(1, true);
//   }, [token, tab]); // eslint-disable-line react-hooks/exhaustive-deps

//   if (loading && items.length === 0) return <PageLoader />;

//   return (
//     <div className="max-w-3xl mx-auto space-y-4">
//       <div className="flex items-center justify-between">
//         <h1 className="font-heading font-bold text-2xl">Legal Documents</h1>
//         <button
//           onClick={() => setShowForm(true)}
//           className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
//         >
//           + New version
//         </button>
//       </div>

//       <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
//         Versioned separately per document type. Marking a new version "current"
//         publishes it immediately and supersedes the previous current version for
//         that type — past versions stay as history.
//       </p>

//       <div className="flex gap-2">
//         {DOC_TABS.map((t) => (
//           <button
//             key={t.key}
//             onClick={() => setTab(t.key)}
//             className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
//               tab === t.key
//                 ? "bg-brand-yellow text-brand-secondary"
//                 : "bg-gray-100 text-gray-600"
//             }`}
//           >
//             {t.label}
//           </button>
//         ))}
//       </div>

//       {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

//       <div className="space-y-2">
//         {items.map((d) => (
//           <div
//             key={d.id}
//             className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
//           >
//             <div className="flex items-start justify-between gap-3">
//               <div className="min-w-0">
//                 <p className="text-sm font-semibold flex items-center gap-2">
//                   {d.doc_type_label}
//                   {d.is_current && (
//                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
//                       Current
//                     </span>
//                   )}
//                 </p>
//                 <p className="text-xs text-font-dim mt-0.5">
//                   v{d.version}
//                   {d.published_at
//                     ? ` • published ${new Date(d.published_at).toLocaleDateString()} by ${d.published_by_name ?? "—"}`
//                     : " • not published"}
//                 </p>
//               </div>
//               <button
//                 onClick={() => setViewTarget(d)}
//                 className="text-xs font-bold text-brand-yellow-lg shrink-0"
//               >
//                 View
//               </button>
//             </div>
//             <p className="text-xs text-font-dim mt-1 line-clamp-2">
//               {d.content}
//             </p>
//           </div>
//         ))}
//         {items.length === 0 && !loading && !error && (
//           <p className="text-sm text-font-dim text-center py-10">
//             No documents yet.
//           </p>
//         )}
//       </div>

//       {loading && items.length > 0 && <InlineLoader />}
//       {hasNext && !loading && (
//         <button
//           onClick={() => load(page + 1, false)}
//           className="w-full text-sm font-semibold text-brand-yellow-lg py-2"
//         >
//           Load more
//         </button>
//       )}

//       {showForm && (
//         <LegalDocumentFormModal
//           onClose={() => setShowForm(false)}
//           onSaved={(saved) => {
//             setItems((prev) => [saved, ...prev]);
//             setShowForm(false);
//           }}
//           token={token!}
//         />
//       )}

//       {viewTarget && (
//         <LegalDocumentViewModal
//           doc={viewTarget}
//           onClose={() => setViewTarget(null)}
//         />
//       )}
//     </div>
//   );
// }

// // ── View ─────────────────────────────────────────────────────────────
// //
// // Read-only — shown as plain preformatted text rather than rendered
// // HTML. The editor above accepts raw HTML/Markdown, and this content
// // also gets shown directly to customers elsewhere; rendering it here
// // with dangerouslySetInnerHTML would mean trusting unsanitized markup,
// // so this view favors showing exactly what was typed over showing a
// // rendered preview.

// function LegalDocumentViewModal({
//   doc,
//   onClose,
// }: {
//   doc: LegalDocumentAdmin;
//   onClose: () => void;
// }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
//       <div onClick={onClose} className="absolute inset-0 bg-black/50" />
//       <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl p-5 space-y-3 max-h-[90vh] flex flex-col">
//         <div className="flex items-start justify-between gap-3">
//           <div className="min-w-0">
//             <h3 className="font-heading font-bold text-base flex items-center gap-2">
//               {doc.doc_type_label}
//               {doc.is_current && (
//                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
//                   Current
//                 </span>
//               )}
//             </h3>
//             <p className="text-xs text-font-dim mt-0.5">
//               v{doc.version}
//               {doc.published_at
//                 ? ` • published ${new Date(doc.published_at).toLocaleDateString()} by ${doc.published_by_name ?? "—"}`
//                 : " • not published"}
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-sm font-semibold text-font-dim shrink-0"
//           >
//             Close
//           </button>
//         </div>
//         <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 overflow-y-auto flex-1">
//           <pre className="text-xs font-mono whitespace-pre-wrap break-words text-gray-800">
//             {doc.content}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── New version ──────────────────────────────────────────────────────

// function LegalDocumentFormModal({
//   onClose,
//   onSaved,
//   token,
// }: {
//   onClose: () => void;
//   onSaved: (d: LegalDocumentAdmin) => void;
//   token: string;
// }) {
//   const [docType, setDocType] = useState("PLATFORM_TC");
//   const [content, setContent] = useState("");
//   const [isCurrent, setIsCurrent] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   async function handleSubmit() {
//     setSubmitting(true);
//     setError(null);
//     const res = await createLegalDocumentApi(token, {
//       doc_type: docType,
//       content,
//       is_current: isCurrent,
//     });
//     if (!res.success || !res.data) {
//       setError(res.message || "Failed to save");
//       setSubmitting(false);
//       return;
//     }
//     onSaved(res.data);
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
//       <div onClick={onClose} className="absolute inset-0 bg-black/50" />
//       <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto">
//         <h3 className="font-heading font-bold text-base">
//           New legal document version
//         </h3>
//         <select
//           value={docType}
//           onChange={(e) => setDocType(e.target.value)}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
//         >
//           <option value="PLATFORM_TC">Platform Terms & Conditions</option>
//           <option value="PRIVACY_POLICY">Privacy Policy</option>
//         </select>
//         <textarea
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//           rows={10}
//           placeholder="Document content (HTML/Markdown allowed)"
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none font-mono"
//         />
//         <label className="flex items-center gap-2 text-sm">
//           <input
//             type="checkbox"
//             checked={isCurrent}
//             onChange={(e) => setIsCurrent(e.target.checked)}
//             className="w-4 h-4 accent-brand-yellow"
//           />
//           Publish immediately (make current)
//         </label>
//         {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
//         <div className="flex gap-3">
//           <button
//             onClick={onClose}
//             disabled={submitting}
//             className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={submitting || !content.trim()}
//             className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
//           >
//             {submitting ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

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
  const [viewTarget, setViewTarget] = useState<LegalDocumentAdmin | null>(null);

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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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
              </div>
              <button
                onClick={() => setViewTarget(d)}
                className="text-xs font-bold text-brand-yellow-lg shrink-0"
              >
                View
              </button>
            </div>
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

      {viewTarget && (
        <LegalDocumentViewModal
          doc={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
    </div>
  );
}

// ── View ─────────────────────────────────────────────────────────────
//
// Renders the actual HTML by default — this content comes out of a
// rich-text editor (hence the data-path-to-node/data-index-in-node
// tracking attributes on every tag) and is the same markup that gets
// shown to customers elsewhere, so rendering it here just shows what
// it will actually look like rather than the underlying markup. It's
// admin-authored, not user-submitted, which is what makes trusting it
// with dangerouslySetInnerHTML reasonable. A "Raw HTML" toggle is kept
// alongside for spot-checking the markup itself — e.g. the [Platform
// Name] / [Date] / [Amount] placeholder tokens visible in the source.

function LegalDocumentViewModal({
  doc,
  onClose,
}: {
  doc: LegalDocumentAdmin;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"rendered" | "raw">("rendered");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl p-5 space-y-3 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-base flex items-center gap-2">
              {doc.doc_type_label}
              {doc.is_current && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Current
                </span>
              )}
            </h3>
            <p className="text-xs text-font-dim mt-0.5">
              v{doc.version}
              {doc.published_at
                ? ` • published ${new Date(doc.published_at).toLocaleDateString()} by ${doc.published_by_name ?? "—"}`
                : " • not published"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-font-dim shrink-0"
          >
            Close
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("rendered")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              mode === "rendered"
                ? "bg-brand-yellow text-brand-secondary"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Rendered
          </button>
          <button
            onClick={() => setMode("raw")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              mode === "raw"
                ? "bg-brand-yellow text-brand-secondary"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Raw HTML
          </button>
        </div>

        {mode === "rendered" ? (
          <div className="legal-doc-content border border-gray-200 rounded-xl p-4 bg-white overflow-y-auto flex-1 text-sm text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: doc.content }} />
            <style jsx>{`
              .legal-doc-content :global(h1) {
                font-size: 1.15rem;
                font-weight: 700;
                margin: 1rem 0 0.5rem;
              }
              .legal-doc-content :global(h2) {
                font-size: 1.05rem;
                font-weight: 700;
                margin: 1rem 0 0.5rem;
              }
              .legal-doc-content :global(h3) {
                font-size: 1rem;
                font-weight: 700;
                margin: 0.75rem 0 0.5rem;
              }
              .legal-doc-content :global(p) {
                margin-bottom: 0.75rem;
                line-height: 1.6;
              }
              .legal-doc-content :global(ul) {
                list-style: disc;
                padding-left: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .legal-doc-content :global(ol) {
                list-style: decimal;
                padding-left: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .legal-doc-content :global(li) {
                margin-bottom: 0.25rem;
                line-height: 1.6;
              }
              .legal-doc-content :global(b),
              .legal-doc-content :global(strong) {
                font-weight: 700;
              }
              .legal-doc-content :global(i),
              .legal-doc-content :global(em) {
                font-style: italic;
              }
              .legal-doc-content :global(a) {
                color: #b45309;
                text-decoration: underline;
              }
              .legal-doc-content :global(blockquote) {
                border-left: 3px solid #e5e7eb;
                padding-left: 0.75rem;
                color: #6b7280;
                margin-bottom: 0.75rem;
              }
            `}</style>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 overflow-y-auto flex-1">
            <pre className="text-xs font-mono whitespace-pre-wrap break-words text-gray-800">
              {doc.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New version ──────────────────────────────────────────────────────

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
