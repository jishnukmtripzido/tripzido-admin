"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getVendorsApi,
  updateVendorStatusApi,
} from "@/services/vendors.service";
import type { VendorListItem } from "@/types/vendor.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function VendorApprovalsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionTarget, setActionTarget] = useState<{
    id: number;
    status: "APPROVED" | "REJECTED";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getVendorsApi(token, 1, "PENDING");
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load");
        return;
      }
      setVendors(res.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirm() {
    if (!actionTarget || !token) return;
    if (actionTarget.status === "REJECTED" && !reason.trim()) {
      setActionError("A reason is required to reject a vendor.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await updateVendorStatusApi(
        token,
        actionTarget.id,
        actionTarget.status,
        reason,
      );
      if (!res.success) {
        setActionError(res.message || "Failed to update status");
        return;
      }
      setVendors((prev) => prev.filter((v) => v.id !== actionTarget.id));
      setActionTarget(null);
      setReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="font-heading font-bold text-2xl">Vendor Approvals</h1>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {vendors.length === 0 && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No vendors awaiting approval.
        </p>
      )}
      <div className="space-y-3">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <button
                  onClick={() => router.push(`/vendors/${v.id}`)}
                  className="font-heading font-bold text-sm hover:text-brand-yellow-lg"
                >
                  {v.business_name}
                </button>
                <p className="text-xs text-font-dim mt-1">
                  {v.owner_name} • {v.phone_number}
                </p>
                <p className="text-xs text-font-dim">
                  {v.email || "no email"} • GST: {v.gst_number || "—"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setActionTarget({ id: v.id, status: "REJECTED" });
                    setReason("");
                    setActionError(null);
                  }}
                  className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setActionTarget({ id: v.id, status: "APPROVED" });
                    setReason("");
                    setActionError(null);
                  }}
                  className="text-xs font-bold text-brand-secondary bg-brand-yellow px-3 py-2 rounded-lg"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {actionTarget?.status === "APPROVED" && (
        <ConfirmDialog
          title="Approve this vendor?"
          message="This vendor will be able to log in and create listings."
          confirmLabel="Approve"
          submitting={submitting}
          error={actionError}
          onCancel={() => setActionTarget(null)}
          onConfirm={handleConfirm}
        />
      )}

      {actionTarget?.status === "REJECTED" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setActionTarget(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
            <h3 className="font-heading font-bold text-base mb-2">
              Reject this vendor?
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason (shown to the vendor)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
            {actionError && (
              <p className="text-sm text-red-500 font-medium mt-2">
                {actionError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setActionTarget(null)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-red-500"
              >
                {submitting ? "Please wait..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
