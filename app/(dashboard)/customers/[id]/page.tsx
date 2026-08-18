"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCustomerDetailApi,
  updateCustomerStatusApi,
} from "@/services/users-admin.service";
import type { AdminCustomerDetail } from "@/types/users-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ["SUSPENDED", "BANNED"],
  SUSPENDED: ["ACTIVE", "BANNED"],
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  BANNED: "bg-gray-800 text-white",
  PENDING_DELETION: "bg-yellow-100 text-yellow-700",
  DELETED: "bg-red-100 text-red-700",
};

const ACTION_LABELS: Record<string, string> = {
  ACTIVE: "Reactivate",
  SUSPENDED: "Suspend",
  BANNED: "Ban permanently",
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAdminAuth();
  const userId = Number(params.id);

  const [user, setUser] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomerDetailApi(token, userId);
      if (!res.success || !res.data) {
        setError(res.message || "User not found");
        return;
      }
      setUser(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;
  if (error || !user)
    return (
      <p className="text-sm text-red-500 text-center py-10">
        {error || "User not found"}
      </p>
    );

  const options = ALLOWED_TRANSITIONS[user.status] ?? [];
  const reasonRequired = target === "SUSPENDED" || target === "BANNED";

  async function handleConfirm() {
    if (!target || !token) return;
    if (reasonRequired && !reason.trim()) {
      setActionError("A reason is required for this action.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await updateCustomerStatusApi(token, userId, target, reason);
      if (!res.success || !res.data) {
        setActionError(res.message || "Failed to update");
        return;
      }
      setUser(res.data);
      setTarget(null);
      setReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => router.push("/customers")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to customers
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-heading font-bold text-lg">{user.full_name}</h1>
            <p className="text-sm text-font-dim mt-1">
              {user.phone_country_code} {user.phone_number}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[user.status] ?? "bg-gray-100"}`}
          >
            {user.status_label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <Field label="Email" value={user.email || "—"} />
          <Field
            label="Joined"
            value={new Date(user.created_at).toLocaleDateString()}
          />
        </div>
        {user.address && (
          <div className="mt-3">
            <p className="text-xs text-font-dim">Address</p>
            <p className="text-sm font-medium">{user.address}</p>
          </div>
        )}

        {user.suspension_reason && user.status === "SUSPENDED" && (
          <p className="text-sm text-orange-600 mt-3 bg-orange-50 rounded-lg p-3">
            Suspended: {user.suspension_reason}
          </p>
        )}
        {user.ban_reason && user.status === "BANNED" && (
          <p className="text-sm text-gray-700 mt-3 bg-gray-100 rounded-lg p-3">
            Banned: {user.ban_reason}
          </p>
        )}
        {user.is_phone_blocked && (
          <p className="text-xs text-red-500 mt-2">
            This phone number is blocked from re-registration.
          </p>
        )}

        {options.length > 0 && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setTarget(opt);
                  setReason("");
                  setActionError(null);
                }}
                className={`text-sm font-bold px-4 py-2 rounded-lg ${
                  opt === "ACTIVE"
                    ? "bg-brand-yellow text-brand-secondary"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {ACTION_LABELS[opt]}
              </button>
            ))}
          </div>
        )}
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setTarget(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
            <h3 className="font-heading font-bold text-base mb-2">
              {ACTION_LABELS[target]} this account?
            </h3>
            {reasonRequired && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
              />
            )}
            {actionError && (
              <p className="text-sm text-red-500 font-medium mt-2">
                {actionError}
              </p>
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
