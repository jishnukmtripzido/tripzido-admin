// app/vendors/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getVendorDetailApi,
  updateVendorStatusApi,
  updateVendorDetailsApi,
  getVendorDocumentsApi,
  reviewDocumentApi,
  updateVendorDocumentApi,
  uploadVendorDocumentApi,
  restoreVendorDocumentApi,
  deleteVendorDocumentApi,
  getVendorBankAccountsApi,
  reviewBankAccountApi,
  updateVendorBankAccountApi,
  createVendorBankAccountApi,
  restoreVendorBankAccountApi,
  deleteVendorBankAccountApi,
  getSubscriptionPlansApi,
  getVendorSubscriptionsApi,
  assignVendorSubscriptionApi,
  getVendorTeamApi,
  addVendorTeamMemberApi,
  removeVendorTeamMemberApi,
  deactivateVendorTeamMemberApi,
  restoreVendorTeamMemberApi,
} from "@/services/vendors.service";
import type {
  VendorDetail,
  VendorDocument,
  VendorBankAccount,
  SubscriptionPlan,
  VendorSubscriptionRecord,
  VendorTeamMember,
} from "@/types/vendor.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["SUSPENDED", "BANNED"],
  SUSPENDED: ["APPROVED", "BANNED"],
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
  BANNED: "bg-gray-800 text-white",
};

const ACTION_LABELS: Record<string, string> = {
  APPROVED: "Approve",
  REJECTED: "Reject",
  SUSPENDED: "Suspend",
  BANNED: "Ban permanently",
};

const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "BUSINESS_REGISTRATION", label: "Business Registration" },
  { value: "ID_PROOF", label: "ID Proof" },
  { value: "GST_CERTIFICATE", label: "GST Certificate" },
  { value: "OTHER", label: "Other" },
];

// KYC document upload constraints, enforced client-side here and
// mirrored server-side (AdminVendorDocumentUploadSerializer /
// AdminVendorDocumentUpdateSerializer) — this is a UX convenience,
// not the source of truth.
const DOC_FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg";
const DOC_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const DOC_FILE_MAX_BYTES = 50 * 1024 * 1024; // 50MB
const DOC_FILE_HINT = "Accepted formats: PDF, PNG, JPEG • Max size: 50MB";

function validateDocFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!DOC_FILE_EXTENSIONS.includes(ext)) {
    return "Only PDF, PNG, or JPEG files are allowed.";
  }
  if (file.size > DOC_FILE_MAX_BYTES) {
    return "File must be 50MB or smaller.";
  }
  return null;
}

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAdminAuth();
  const vendorId = Number(params.id);

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getVendorDetailApi(token, vendorId);
      if (!res.success || !res.data) {
        setError(res.message || "Vendor not found");
        return;
      }
      setVendor(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;
  if (error || !vendor)
    return (
      <p className="text-sm text-red-500 text-center py-10">
        {error || "Vendor not found"}
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => router.push("/vendors")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to vendors
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-xl">
              {vendor.business_name}
            </h1>
            <p className="text-sm text-font-dim mt-1">{vendor.owner_name}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-brand-yellow-lg"
            >
              Edit details
            </button>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[vendor.status] ?? "bg-gray-100"}`}
            >
              {vendor.status_label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <Field label="Phone" value={vendor.phone_number} />
          <Field label="Email" value={vendor.email || "—"} />
          <Field label="GST" value={vendor.gst_number || "—"} />
          <Field
            label="Joined"
            value={new Date(vendor.created_at).toLocaleDateString()}
          />
        </div>
        <div className="mt-3">
          <p className="text-xs text-font-dim">Address</p>
          <p className="text-sm font-medium">{vendor.address}</p>
        </div>

        {vendor.rejection_reason && (
          <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg p-3">
            Rejected: {vendor.rejection_reason}
          </p>
        )}
        {vendor.suspension_reason && vendor.status === "SUSPENDED" && (
          <p className="text-sm text-orange-600 mt-3 bg-orange-50 rounded-lg p-3">
            Suspended: {vendor.suspension_reason}
          </p>
        )}
        {vendor.ban_reason && vendor.status === "BANNED" && (
          <p className="text-sm text-gray-700 mt-3 bg-gray-100 rounded-lg p-3">
            Banned: {vendor.ban_reason}
          </p>
        )}

        <StatusActions vendor={vendor} token={token!} onUpdated={setVendor} />
      </div>

      <DocumentsSection vendorId={vendorId} token={token!} />
      <BankAccountsSection vendorId={vendorId} token={token!} />
      <SubscriptionSection
        vendor={vendor}
        token={token!}
        onUpdated={setVendor}
      />
      <TeamSection vendorId={vendor.id} token={token!} />

      {editing && (
        <EditVendorModal
          vendor={vendor}
          token={token!}
          onClose={() => setEditing(false)}
          onUpdated={(v) => {
            setVendor(v);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-font-dim">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

// ── Edit vendor details ─────────────────────────────────────────────────

function EditVendorModal({
  vendor,
  token,
  onClose,
  onUpdated,
}: {
  vendor: VendorDetail;
  token: string;
  onClose: () => void;
  onUpdated: (v: VendorDetail) => void;
}) {
  const [businessName, setBusinessName] = useState(vendor.business_name);
  const [ownerName, setOwnerName] = useState(vendor.owner_name);
  const [email, setEmail] = useState(vendor.email);
  const [address, setAddress] = useState(vendor.address);
  const [gstNumber, setGstNumber] = useState(vendor.gst_number);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateVendorDetailsApi(token, vendor.id, {
        business_name: businessName,
        owner_name: ownerName,
        email,
        address,
        gst_number: gstNumber,
      });
      if (!res.success || !res.data) {
        setError(res.message || "Failed to update");
        return;
      }
      onUpdated(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">
          Edit vendor details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Owner name"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          placeholder="Address"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <input
          value={gstNumber}
          onChange={(e) => setGstNumber(e.target.value)}
          placeholder="GST number (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
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
            disabled={submitting}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status actions ──────────────────────────────────────────────────────

function StatusActions({
  vendor,
  token,
  onUpdated,
}: {
  vendor: VendorDetail;
  token: string;
  onUpdated: (v: VendorDetail) => void;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = ALLOWED_TRANSITIONS[vendor.status] ?? [];
  if (options.length === 0) return null;

  const reasonRequired =
    target === "REJECTED" || target === "SUSPENDED" || target === "BANNED";

  async function handleConfirm() {
    if (!target) return;
    if (reasonRequired && !reason.trim()) {
      setError("A reason is required for this action.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateVendorStatusApi(token, vendor.id, target, reason);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to update");
        return;
      }
      onUpdated(res.data);
      setTarget(null);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              setTarget(opt);
              setReason("");
              setError(null);
            }}
            className={`text-sm font-bold px-4 py-2 rounded-lg ${
              opt === "APPROVED"
                ? "bg-brand-yellow text-brand-secondary"
                : "bg-red-50 text-red-600"
            }`}
          >
            {ACTION_LABELS[opt]}
          </button>
        ))}
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setTarget(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
            <h3 className="font-heading font-bold text-base mb-2">
              {ACTION_LABELS[target]} this vendor?
            </h3>
            {reasonRequired && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason (visible to the vendor where applicable)"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            )}
            {error && (
              <p className="text-sm text-red-500 font-medium mt-2">{error}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setTarget(null)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-red-500 disabled:opacity-50"
              >
                {submitting ? "Please wait..." : ACTION_LABELS[target]}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Documents ─────────────────────────────────────────────────────────
//
// Deactivate has been removed from this page — admins can only Edit,
// Delete (permanent), or Activate a document that was deactivated
// previously (e.g. legacy data). Adding a new document is now possible
// directly from this page, not just at registration.

function DocumentsSection({
  vendorId,
  token,
}: {
  vendorId: number;
  token: string;
}) {
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editTarget, setEditTarget] = useState<VendorDocument | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    doc: VendorDocument;
    action: "restore" | "delete";
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendorDocumentsApi(token, vendorId);
      if (res.success && res.data) setDocs(res.data);
    } finally {
      setLoading(false);
    }
  }, [token, vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(
    docId: number,
    newStatus: "VERIFIED" | "REJECTED",
    rejectionReason: string,
  ) {
    const res = await reviewDocumentApi(
      token,
      docId,
      newStatus,
      rejectionReason,
    );
    if (res.success && res.data) {
      setDocs((prev) => prev.map((d) => (d.id === docId ? res.data! : d)));
    }
    return res;
  }

  async function handleConfirmAction() {
    if (!actionTarget) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      let res;
      if (actionTarget.action === "restore") {
        res = await restoreVendorDocumentApi(token, actionTarget.doc.id);
      } else {
        res = await deleteVendorDocumentApi(token, actionTarget.doc.id);
      }
      if (!res.success) {
        setActionError(res.message || "Action failed");
        return;
      }
      if (actionTarget.action === "delete") {
        setDocs((prev) => prev.filter((d) => d.id !== actionTarget.doc.id));
      } else {
        setDocs((prev) =>
          prev.map((d) =>
            d.id === actionTarget.doc.id ? { ...d, is_active: true } : d,
          ),
        );
      }
      setActionTarget(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-sm">
          KYC Documents ({docs.length})
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-xs font-bold text-brand-yellow-lg"
        >
          + Add document
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-font-dim">Loading...</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-font-dim">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onReview={handleReview}
              onEdit={() => setEditTarget(doc)}
              onAction={(action) => {
                setActionTarget({ doc, action });
                setActionError(null);
              }}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <AddDocumentModal
          vendorId={vendorId}
          token={token}
          onClose={() => setShowAddForm(false)}
          onAdded={(d) => {
            setDocs((prev) => [d, ...prev]);
            setShowAddForm(false);
          }}
        />
      )}

      {editTarget && (
        <EditDocumentModal
          doc={editTarget}
          token={token}
          onClose={() => setEditTarget(null)}
          onUpdated={(d) => {
            setDocs((prev) => prev.map((x) => (x.id === d.id ? d : x)));
            setEditTarget(null);
          }}
        />
      )}

      {actionTarget && (
        <ConfirmDialog
          title={
            actionTarget.action === "delete"
              ? "Permanently delete this document?"
              : "Reactivate this document?"
          }
          message={
            actionTarget.action === "delete"
              ? "This permanently removes the document. This cannot be undone."
              : "This document will be visible and active again."
          }
          confirmLabel={
            actionTarget.action === "delete" ? "Delete permanently" : "Activate"
          }
          destructive={actionTarget.action === "delete"}
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionTarget(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  onReview,
  onEdit,
  onAction,
}: {
  doc: VendorDocument;
  onReview: (
    id: number,
    status: "VERIFIED" | "REJECTED",
    reason: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onEdit: () => void;
  onAction: (action: "restore" | "delete") => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setSubmitting(true);
    const res = await onReview(doc.id, "VERIFIED", "");
    if (!res.success) setError(res.message || "Failed");
    setSubmitting(false);
  }
  async function handleReject() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    const res = await onReview(doc.id, "REJECTED", reason);
    if (!res.success) setError(res.message || "Failed");
    else setRejecting(false);
    setSubmitting(false);
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            {doc.doc_type_label}
            {!doc.is_active && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                Inactive
              </span>
            )}
          </p>
          <a
            href={doc.file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-yellow-lg font-medium"
          >
            {doc.original_filename}
          </a>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            doc.status === "VERIFIED"
              ? "bg-green-100 text-green-700"
              : doc.status === "REJECTED"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {doc.status_label}
        </span>
      </div>

      {doc.status === "PENDING" && (
        <div className="mt-2">
          {!rejecting ? (
            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={submitting}
                className="text-xs font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg"
              >
                Verify
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="mt-1 space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Rejection reason"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejecting(false)}
                  className="text-xs font-semibold text-font-dim"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg"
                >
                  Confirm reject
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      )}
      {doc.status === "REJECTED" && doc.rejection_reason && (
        <p className="text-xs text-red-600 mt-2">
          Reason: {doc.rejection_reason}
        </p>
      )}

      <div className="flex gap-3 mt-2 pt-2 border-t border-gray-50">
        <button
          onClick={onEdit}
          className="text-xs font-bold text-brand-yellow-lg"
        >
          Edit
        </button>
        {!doc.is_active && (
          <button
            onClick={() => onAction("restore")}
            className="text-xs font-bold text-green-600"
          >
            Activate
          </button>
        )}
        <button
          onClick={() => onAction("delete")}
          className="text-xs font-bold text-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AddDocumentModal({
  vendorId,
  token,
  onClose,
  onAdded,
}: {
  vendorId: number;
  token: string;
  onClose: () => void;
  onAdded: (d: VendorDocument) => void;
}) {
  const [docType, setDocType] = useState(DOC_TYPE_OPTIONS[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await uploadVendorDocumentApi(token, vendorId, docType, file);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to upload document");
        return;
      }
      onAdded(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload document",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">Add document</h3>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {DOC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div>
          <p className="text-xs text-font-dim mb-1">File</p>
          <input
            type="file"
            accept={DOC_FILE_ACCEPT}
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              if (!selected) {
                setFile(null);
                return;
              }
              const validationError = validateDocFile(selected);
              if (validationError) {
                setError(validationError);
                setFile(null);
                e.target.value = "";
                return;
              }
              setError(null);
              setFile(selected);
            }}
            className="w-full text-sm"
          />
          <p className="text-[11px] text-font-dim mt-1">{DOC_FILE_HINT}</p>
        </div>
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
            disabled={submitting || !file}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditDocumentModal({
  doc,
  token,
  onClose,
  onUpdated,
}: {
  doc: VendorDocument;
  token: string;
  onClose: () => void;
  onUpdated: (d: VendorDocument) => void;
}) {
  const [docType, setDocType] = useState(doc.doc_type);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateVendorDocumentApi(token, doc.id, {
        doc_type: docType !== doc.doc_type ? docType : undefined,
        file: file ?? undefined,
      });
      if (!res.success || !res.data) {
        setError(res.message || "Failed to update");
        return;
      }
      onUpdated(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">Edit document</h3>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {DOC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div>
          <p className="text-xs text-font-dim mb-1">Replace file (optional)</p>
          <input
            type="file"
            accept={DOC_FILE_ACCEPT}
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              if (!selected) {
                setFile(null);
                return;
              }
              const validationError = validateDocFile(selected);
              if (validationError) {
                setError(validationError);
                setFile(null);
                e.target.value = "";
                return;
              }
              setError(null);
              setFile(selected);
            }}
            className="w-full text-sm"
          />
          <p className="text-[11px] text-font-dim mt-1">{DOC_FILE_HINT}</p>
        </div>
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
            disabled={submitting}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bank accounts ─────────────────────────────────────────────────────
//
// Deactivate has been removed here too. A vendor can have more than one
// bank account on file: adding a new one always saves it as a brand-new
// record and — same as the existing verify flow — automatically becomes
// the active payout account, superseding whichever one was active
// before (this cascade already lives in the BankAccount model's save()
// override on the backend). The main list therefore only ever shows the
// current active account plus anything still awaiting review; every
// other record (rejected, superseded, previously active) is one tap
// away in the "View previous" popup rather than cluttering the main view.

function BankAccountsSection({
  vendorId,
  token,
}: {
  vendorId: number;
  token: string;
}) {
  const [accounts, setAccounts] = useState<VendorBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editTarget, setEditTarget] = useState<VendorBankAccount | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    account: VendorBankAccount;
    action: "restore" | "delete";
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendorBankAccountsApi(token, vendorId);
      if (res.success && res.data) setAccounts(res.data);
    } finally {
      setLoading(false);
    }
  }, [token, vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(
    accountId: number,
    newStatus: "VERIFIED" | "REJECTED",
    reason: string,
  ) {
    const res = await reviewBankAccountApi(token, accountId, newStatus, reason);
    if (res.success) load(); // full reload — verifying one deactivates others server-side
    return res;
  }

  async function handleConfirmAction() {
    if (!actionTarget) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      let res;
      if (actionTarget.action === "restore") {
        res = await restoreVendorBankAccountApi(token, actionTarget.account.id);
      } else {
        res = await deleteVendorBankAccountApi(token, actionTarget.account.id);
      }
      if (!res.success) {
        setActionError(res.message || "Action failed");
        return;
      }
      if (actionTarget.action === "delete") {
        setAccounts((prev) =>
          prev.filter((a) => a.id !== actionTarget.account.id),
        );
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === actionTarget.account.id ? { ...a, is_active: true } : a,
          ),
        );
      }
      setActionTarget(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionSubmitting(false);
    }
  }

  // Shown inline: the current active payout account, plus anything the
  // vendor submitted that's still waiting on a decision.
  const primaryAccounts = accounts.filter(
    (a) => a.is_active && (a.is_active_acc || a.status === "PENDING"),
  );
  // Everything else — rejected, superseded, or previously deactivated —
  // is tucked away behind "View previous".
  const historyAccounts = accounts.filter(
    (a) => !primaryAccounts.some((p) => p.id === a.id),
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-sm">Bank Accounts</h2>
        <div className="flex items-center gap-3">
          {historyAccounts.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs font-bold text-font-dim underline"
            >
              View previous ({historyAccounts.length})
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs font-bold text-brand-yellow-lg"
          >
            + Add account
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-font-dim">Loading...</p>
      ) : primaryAccounts.length === 0 ? (
        <p className="text-sm text-font-dim">No active bank account on file.</p>
      ) : (
        <div className="space-y-3">
          {primaryAccounts.map((acc) => (
            <BankAccountRow
              key={acc.id}
              account={acc}
              onReview={handleReview}
              onEdit={() => setEditTarget(acc)}
              onAction={(action) => {
                setActionTarget({ account: acc, action });
                setActionError(null);
              }}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <AddBankAccountModal
          vendorId={vendorId}
          token={token}
          onClose={() => setShowAddForm(false)}
          onAdded={() => {
            setShowAddForm(false);
            load();
          }}
        />
      )}

      {editTarget && (
        <EditBankAccountModal
          account={editTarget}
          token={token}
          onClose={() => setEditTarget(null)}
          onUpdated={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}

      {showHistory && (
        <BankAccountHistoryModal
          accounts={historyAccounts}
          onClose={() => setShowHistory(false)}
          onAction={(account, action) => {
            setShowHistory(false);
            setActionTarget({ account, action });
            setActionError(null);
          }}
        />
      )}

      {actionTarget && (
        <ConfirmDialog
          title={
            actionTarget.action === "delete"
              ? "Permanently delete this bank account?"
              : "Reactivate this bank account?"
          }
          message={
            actionTarget.action === "delete"
              ? "This permanently removes the bank account. This cannot be undone."
              : "This account becomes visible again. It won't automatically become the active payout account."
          }
          confirmLabel={
            actionTarget.action === "delete" ? "Delete permanently" : "Activate"
          }
          destructive={actionTarget.action === "delete"}
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionTarget(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}

function BankAccountRow({
  account,
  onReview,
  onEdit,
  onAction,
}: {
  account: VendorBankAccount;
  onReview: (
    id: number,
    status: "VERIFIED" | "REJECTED",
    reason: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onEdit: () => void;
  onAction: (action: "restore" | "delete") => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setSubmitting(true);
    const res = await onReview(account.id, "VERIFIED", "");
    if (!res.success) setError(res.message || "Failed");
    setSubmitting(false);
  }
  async function handleReject() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    const res = await onReview(account.id, "REJECTED", reason);
    if (!res.success) setError(res.message || "Failed");
    else setRejecting(false);
    setSubmitting(false);
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            {account.account_holder_name}
            {!account.is_active && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                Inactive
              </span>
            )}
          </p>
          <p className="text-xs text-font-dim">
            {account.bank_name || "—"} • {account.account_number_masked} •{" "}
            {account.ifsc_code}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {account.is_active_acc && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Active Payout
            </span>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              account.status === "VERIFIED"
                ? "bg-green-100 text-green-700"
                : account.status === "REJECTED"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {account.status_label}
          </span>
        </div>
      </div>

      {account.status === "PENDING" && (
        <div className="mt-2">
          {!rejecting ? (
            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={submitting}
                className="text-xs font-bold text-brand-secondary bg-brand-yellow px-3 py-1.5 rounded-lg"
              >
                Verify
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="mt-1 space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Rejection reason"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejecting(false)}
                  className="text-xs font-semibold text-font-dim"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg"
                >
                  Confirm reject
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      )}
      {account.status === "REJECTED" && account.rejection_reason && (
        <p className="text-xs text-red-600 mt-2">
          Reason: {account.rejection_reason}
        </p>
      )}

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
        <button
          onClick={onEdit}
          className="text-xs font-bold text-brand-yellow-lg"
        >
          Edit
        </button>
        {!account.is_active && (
          <button
            onClick={() => onAction("restore")}
            className="text-xs font-bold text-green-600"
          >
            Activate
          </button>
        )}
        {account.is_active_acc ? (
          <span className="text-[11px] text-font-dim">
            This is the active payout account — add a new one to replace it
            before this can be deleted.
          </span>
        ) : (
          <button
            onClick={() => onAction("delete")}
            className="text-xs font-bold text-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function AddBankAccountModal({
  vendorId,
  token,
  onClose,
  onAdded,
}: {
  vendorId: number;
  token: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    holderName.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    ifsc.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createVendorBankAccountApi(token, vendorId, {
        account_holder_name: holderName,
        account_number: accountNumber,
        ifsc_code: ifsc,
        bank_name: bankName,
      });
      if (!res.success) {
        setError(res.message || "Failed to add bank account");
        return;
      }
      onAdded();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add bank account",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">Add bank account</h3>
        <p className="text-xs text-font-dim -mt-1">
          Saved as a new record and set as the active payout account.
        </p>
        <input
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder="Account holder name"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Account number"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value.toUpperCase())}
          placeholder="IFSC code"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Bank name (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
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
            disabled={submitting || !canSubmit}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BankAccountHistoryModal({
  accounts,
  onClose,
  onAction,
}: {
  accounts: VendorBankAccount[];
  onClose: () => void;
  onAction: (account: VendorBankAccount, action: "restore" | "delete") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-3 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base">
            Previous bank accounts
          </h3>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-font-dim"
          >
            Close
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-sm text-font-dim">No previous bank accounts.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => {
              // Every account in this list is, by definition, not the
              // current active payout account. The backend's own
              // status_label for VERIFIED literally reads "Verified –
              // Active", which would misleadingly suggest otherwise here
              // — so history gets its own wording instead of trusting it.
              const historyBadge =
                acc.status === "VERIFIED"
                  ? {
                      text: "Previously Active",
                      className: "bg-gray-100 text-gray-600",
                    }
                  : acc.status === "REJECTED"
                    ? { text: "Rejected", className: "bg-red-100 text-red-700" }
                    : acc.status === "SUPERSEDED"
                      ? {
                          text: "Superseded",
                          className: "bg-gray-100 text-gray-600",
                        }
                      : {
                          text: acc.status_label,
                          className: "bg-yellow-100 text-yellow-700",
                        };

              return (
                <div
                  key={acc.id}
                  className="border border-gray-100 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {acc.account_holder_name}
                        {!acc.is_active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-font-dim">
                        {acc.bank_name || "—"} • {acc.account_number_masked} •{" "}
                        {acc.ifsc_code}
                      </p>
                      <p className="text-[10px] text-font-dim mt-0.5">
                        Submitted{" "}
                        {new Date(acc.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${historyBadge.className}`}
                    >
                      {historyBadge.text}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-2 pt-2 border-t border-gray-50">
                    {!acc.is_active && (
                      <button
                        onClick={() => onAction(acc, "restore")}
                        className="text-xs font-bold text-green-600"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => onAction(acc, "delete")}
                      className="text-xs font-bold text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EditBankAccountModal({
  account,
  token,
  onClose,
  onUpdated,
}: {
  account: VendorBankAccount;
  token: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [holderName, setHolderName] = useState(account.account_holder_name);
  const [accountNumber, setAccountNumber] = useState(
    account.account_number_masked,
  );
  const [ifsc, setIfsc] = useState(account.ifsc_code);
  const [bankName, setBankName] = useState(account.bank_name);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateVendorBankAccountApi(token, account.id, {
        account_holder_name: holderName,
        account_number: accountNumber,
        ifsc_code: ifsc,
        bank_name: bankName,
      });
      if (!res.success) {
        setError(res.message || "Failed to update");
        return;
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">Edit bank account</h3>
        <input
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder="Account holder name"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Account number"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value.toUpperCase())}
          placeholder="IFSC code"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Bank name (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
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
            disabled={submitting}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subscription ──────────────────────────────────────────────────────

function SubscriptionSection({
  vendor,
  token,
  onUpdated,
}: {
  vendor: VendorDetail;
  token: string;
  onUpdated: (v: VendorDetail) => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<VendorSubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, historyRes] = await Promise.all([
        getSubscriptionPlansApi(token),
        getVendorSubscriptionsApi(token, vendor.id),
      ]);
      if (plansRes.success && plansRes.data) setPlans(plansRes.data);
      if (historyRes.success && historyRes.data) setHistory(historyRes.data);
    } finally {
      setLoading(false);
    }
  }, [token, vendor.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign() {
    if (!selectedPlanId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await assignVendorSubscriptionApi(
        token,
        vendor.id,
        selectedPlanId,
      );
      if (!res.success) {
        setError(res.message || "Failed to assign");
        return;
      }
      setAssigning(false);
      setSelectedPlanId(null);
      load();
      const detailRes = await getVendorDetailApi(token, vendor.id);
      if (detailRes.success && detailRes.data) onUpdated(detailRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-sm">Subscription</h2>
        <button
          onClick={() => setAssigning(true)}
          className="text-xs font-bold text-brand-yellow-lg"
        >
          Assign plan
        </button>
      </div>

      {vendor.current_subscription ? (
        <div className="bg-brand-yellow/10 rounded-xl p-3 mb-3">
          <p className="text-sm font-semibold">
            {vendor.current_subscription.plan_name}
          </p>
          <p className="text-xs text-font-dim mt-0.5">
            {vendor.current_subscription.status}
            {vendor.current_subscription.expires_at &&
              ` • expires ${new Date(vendor.current_subscription.expires_at).toLocaleDateString()}`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-font-dim mb-3">No active subscription.</p>
      )}

      {loading ? (
        <p className="text-sm text-font-dim">Loading history...</p>
      ) : (
        <div className="space-y-2">
          {history.map((h) => (
            <div
              key={h.id}
              className="flex justify-between text-xs text-font-dim border-b border-gray-50 pb-1.5"
            >
              <span>
                {h.plan_name} — {h.status_label}
                {h.is_manually_assigned ? " (manual)" : ""}
              </span>
              <span>{new Date(h.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setAssigning(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
            <h3 className="font-heading font-bold text-base mb-3">
              Assign subscription plan
            </h3>
            <select
              value={selectedPlanId ?? ""}
              onChange={(e) =>
                setSelectedPlanId(Number(e.target.value) || null)
              }
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Select a plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.billing_cycle} ₹{p.price}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-sm text-red-500 font-medium mt-2">{error}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setAssigning(false)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={submitting || !selectedPlanId}
                className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
              >
                {submitting ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team ─────────────────────────────────────────────────────────────

function TeamSection({ vendorId, token }: { vendorId: number; token: string }) {
  const [members, setMembers] = useState<VendorTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [actionTarget, setActionTarget] = useState<{
    member: VendorTeamMember;
    action: "deactivate" | "restore" | "delete";
  } | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getVendorTeamApi(token, vendorId);
    if (res.success && res.data) setMembers(res.data);
    setLoading(false);
  }, [token, vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirmAction() {
    if (!actionTarget) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      let res;
      if (actionTarget.action === "deactivate") {
        res = await deactivateVendorTeamMemberApi(
          token,
          actionTarget.member.id,
        );
      } else if (actionTarget.action === "restore") {
        res = await restoreVendorTeamMemberApi(token, actionTarget.member.id);
      } else {
        res = await removeVendorTeamMemberApi(token, actionTarget.member.id);
      }
      if (!res.success) {
        setActionError(res.message || "Action failed");
        return;
      }
      if (actionTarget.action === "delete") {
        setMembers((prev) =>
          prev.filter((m) => m.id !== actionTarget.member.id),
        );
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === actionTarget.member.id
              ? { ...m, is_active: actionTarget.action === "restore" }
              : m,
          ),
        );
      }
      setActionTarget(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-sm">
          Team ({members.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="text-xs font-bold text-brand-yellow-lg"
        >
          + Add member
        </button>
      </div>
      <p className="text-xs text-font-dim mb-3">
        Additional logins that share full access to this vendor&rsquo;s fleet,
        bookings, and payouts.
      </p>

      {loading ? (
        <p className="text-sm text-font-dim">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-font-dim">No additional team members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border border-gray-100 rounded-xl p-3"
            >
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  {m.full_name}
                  {!m.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-xs text-font-dim">
                  {m.phone_number} • {m.email || "no email"}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                {m.is_active ? (
                  <button
                    onClick={() => {
                      setActionTarget({ member: m, action: "deactivate" });
                      setActionError(null);
                    }}
                    className="text-xs font-bold text-orange-600"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActionTarget({ member: m, action: "restore" });
                      setActionError(null);
                    }}
                    className="text-xs font-bold text-green-600"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => {
                    setActionTarget({ member: m, action: "delete" });
                    setActionError(null);
                  }}
                  className="text-xs font-bold text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TeamMemberFormModal
          vendorId={vendorId}
          token={token}
          onClose={() => setShowForm(false)}
          onAdded={(m) => {
            setMembers((prev) => [m, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {actionTarget && (
        <ConfirmDialog
          title={
            actionTarget.action === "delete"
              ? "Permanently delete this team member?"
              : actionTarget.action === "deactivate"
                ? "Deactivate this team member?"
                : "Reactivate this team member?"
          }
          message={
            actionTarget.action === "delete"
              ? `This permanently removes ${actionTarget.member.full_name}'s access. This cannot be undone.`
              : actionTarget.action === "deactivate"
                ? `${actionTarget.member.full_name} will lose access immediately and won't be able to log in. You can reactivate them later.`
                : `${actionTarget.member.full_name} will regain access and be able to log in again.`
          }
          confirmLabel={
            actionTarget.action === "delete"
              ? "Delete permanently"
              : actionTarget.action === "deactivate"
                ? "Deactivate"
                : "Activate"
          }
          destructive={actionTarget.action !== "restore"}
          submitting={actionSubmitting}
          error={actionError}
          onCancel={() => setActionTarget(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}

function TeamMemberFormModal({
  vendorId,
  token,
  onClose,
  onAdded,
}: {
  vendorId: number;
  token: string;
  onClose: () => void;
  onAdded: (m: VendorTeamMember) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await addVendorTeamMemberApi(token, vendorId, {
        phone_number: phoneNumber,
        phone_country_code: "+91",
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      if (!res.success || !res.data) {
        setError(res.message || "Failed to add team member");
        return;
      }
      onAdded(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add team member",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">New team member</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone number"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
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
            disabled={
              submitting ||
              !phoneNumber.trim() ||
              !email.trim() ||
              password.length < 8
            }
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
