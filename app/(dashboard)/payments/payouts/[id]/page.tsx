"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getPayoutDetailApi,
  updatePayoutStatusApi,
} from "@/services/payments-admin.service";
import type { VendorPayoutDetail } from "@/types/payments-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAdminAuth();
  const payoutId = Number(params.id);

  const [payout, setPayout] = useState<VendorPayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<"PAID" | "FAILED" | "PENDING" | null>(
    null,
  );
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPayoutDetailApi(token, payoutId);
      if (!res.success || !res.data) {
        setError(res.message || "Payout not found");
        return;
      }
      setPayout(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, payoutId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirmAction() {
    if (!action || !token) return;
    if (action === "PAID" && !utr.trim()) {
      setActionError("UTR number is required to mark this payout as paid.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await updatePayoutStatusApi(token, payoutId, {
        status: action,
        utr_number: utr,
        note,
      });
      if (!res.success || !res.data) {
        setActionError(res.message || "Failed to update");
        return;
      }
      setPayout(res.data);
      setAction(null);
      setUtr("");
      setNote("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error || !payout)
    return (
      <p className="text-sm text-red-500 text-center py-10">
        {error || "Payout not found"}
      </p>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.push("/payments/payouts")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to payouts
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-heading font-bold text-lg">
              {payout.vendor_name}
            </h1>
            <p className="text-sm text-font-dim mt-1">Payout #{payout.id}</p>
          </div>
          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[payout.status] ?? "bg-gray-100"}`}
          >
            {payout.status_label}
          </span>
        </div>
        <p className="text-3xl font-heading font-extrabold text-brand-secondary mt-3">
          ₹
          {Number(payout.total_amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </p>

        {payout.status === "PENDING" && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setAction("PAID");
                setUtr("");
                setNote("");
                setActionError(null);
              }}
              className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary"
            >
              Mark as paid
            </button>
            <button
              onClick={() => {
                setAction("FAILED");
                setUtr("");
                setNote("");
                setActionError(null);
              }}
              className="flex-1 rounded-xl py-3 text-sm font-bold bg-red-50 text-red-600"
            >
              Mark as failed
            </button>
          </div>
        )}
        {payout.status === "FAILED" && (
          <button
            onClick={() => {
              setAction("PENDING");
              setUtr("");
              setNote("");
              setActionError(null);
            }}
            className="w-full mt-4 pt-4 border-t border-gray-100 rounded-xl py-3 text-sm font-bold bg-gray-100 text-gray-700"
          >
            Reset to pending (retry)
          </button>
        )}
      </div>

      <Section title="Transfer details">
        <Row
          label="UTR number"
          value={payout.utr_number || "Not recorded yet"}
        />
        <Row
          label="Paid on"
          value={
            payout.paid_at ? new Date(payout.paid_at).toLocaleString() : "—"
          }
        />
        <Row label="Paid by" value={payout.paid_by_name || "—"} />
        {payout.period_start && payout.period_end && (
          <Row
            label="Period"
            value={`${payout.period_start} to ${payout.period_end}`}
          />
        )}
        {payout.note && <Row label="Note" value={payout.note} />}
      </Section>

      {Object.keys(payout.bank_account_snapshot).length > 0 && (
        <Section title="Bank account (at time of payout)">
          {Object.entries(payout.bank_account_snapshot).map(([key, value]) => (
            <Row
              key={key}
              label={key.replace(/_/g, " ")}
              value={String(value)}
            />
          ))}
        </Section>
      )}

      <Section title={`Bookings covered (${payout.items.length})`}>
        <div className="space-y-2">
          {payout.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{item.vehicle_name}</p>
                <p className="text-xs text-font-dim">
                  #{item.booking_reference} • {item.pickup_date} →{" "}
                  {item.dropoff_date}
                </p>
              </div>
              <p className="text-sm font-bold text-brand-secondary">
                ₹{item.amount}
              </p>
            </div>
          ))}
          {payout.items.length === 0 && (
            <p className="text-sm text-font-dim">No bookings attached.</p>
          )}
        </div>
      </Section>

      {action && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setAction(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
            <h3 className="font-heading font-bold text-base">
              {action === "PAID"
                ? "Mark this payout as paid?"
                : action === "FAILED"
                  ? "Mark this payout as failed?"
                  : "Reset this payout to pending?"}
            </h3>
            {action === "PAID" && (
              <input
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="UTR / transaction reference number"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Note (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
            {actionError && (
              <p className="text-sm text-red-500 font-medium">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setAction(null)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-50 ${
                  action === "FAILED"
                    ? "text-white bg-red-500"
                    : "bg-brand-yellow text-brand-secondary"
                }`}
              >
                {submitting ? "Please wait..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-heading font-bold text-sm mb-3">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-font-dim capitalize">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
