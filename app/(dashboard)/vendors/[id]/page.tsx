"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getVendorDetailApi,
  updateVendorStatusApi,
  getVendorDocumentsApi,
  reviewDocumentApi,
  getVendorBankAccountsApi,
  reviewBankAccountApi,
  getSubscriptionPlansApi,
  getVendorSubscriptionsApi,
  assignVendorSubscriptionApi,
  getVendorTeamApi,
  addVendorTeamMemberApi,
  removeVendorTeamMemberApi,
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

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAdminAuth();
  const vendorId = Number(params.id);

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[vendor.status] ?? "bg-gray-100"}`}
          >
            {vendor.status_label}
          </span>
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

function DocumentsSection({
  vendorId,
  token,
}: {
  vendorId: number;
  token: string;
}) {
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-heading font-bold text-sm mb-3">
        KYC Documents ({docs.length})
      </h2>
      {loading ? (
        <p className="text-sm text-font-dim">Loading...</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-font-dim">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onReview={handleReview} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  onReview,
}: {
  doc: VendorDocument;
  onReview: (
    id: number,
    status: "VERIFIED" | "REJECTED",
    reason: string,
  ) => Promise<{ success: boolean; message?: string }>;
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
          <p className="text-sm font-semibold">{doc.doc_type_label}</p>
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
    </div>
  );
}

// ── Bank accounts ─────────────────────────────────────────────────────

function BankAccountsSection({
  vendorId,
  token,
}: {
  vendorId: number;
  token: string;
}) {
  const [accounts, setAccounts] = useState<VendorBankAccount[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-heading font-bold text-sm mb-3">
        Bank Accounts ({accounts.length})
      </h2>
      {loading ? (
        <p className="text-sm text-font-dim">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-font-dim">No bank account submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <BankAccountRow
              key={acc.id}
              account={acc}
              onReview={handleReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BankAccountRow({
  account,
  onReview,
}: {
  account: VendorBankAccount;
  onReview: (
    id: number,
    status: "VERIFIED" | "REJECTED",
    reason: string,
  ) => Promise<{ success: boolean; message?: string }>;
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
          <p className="text-sm font-semibold">{account.account_holder_name}</p>
          <p className="text-xs text-font-dim">
            {account.bank_name || "—"} • {account.account_number_masked} •{" "}
            {account.ifsc_code}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {account.is_active_acc && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Active
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
  const [removeTarget, setRemoveTarget] = useState<VendorTeamMember | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getVendorTeamApi(token, vendorId);
    if (res.success && res.data) setMembers(res.data);
    setLoading(false);
  }, [token, vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    setRemoveError(null);
    const res = await removeVendorTeamMemberApi(token, removeTarget.id);
    if (!res.success) {
      setRemoveError(res.message || "Failed to remove");
      setRemoving(false);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
    setRemoveTarget(null);
    setRemoving(false);
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
        bookings, and payouts — separate from the primary owner account.
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
                <p className="text-sm font-semibold">{m.full_name}</p>
                <p className="text-xs text-font-dim">
                  {m.phone_number} • {m.email || "no email"}
                </p>
              </div>
              <button
                onClick={() => {
                  setRemoveTarget(m);
                  setRemoveError(null);
                }}
                className="text-xs font-bold text-red-500"
              >
                Remove
              </button>
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

      {removeTarget && (
        <ConfirmDialog
          title="Remove this team member?"
          message={`${removeTarget.full_name} will no longer be able to log into the vendor portal for this business.`}
          confirmLabel="Remove"
          destructive
          submitting={removing}
          error={removeError}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemove}
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
