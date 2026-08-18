"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCancellationPoliciesApi,
  getCancellationPolicyDetailApi,
  createCancellationPolicyApi,
} from "@/services/content-admin.service";
import type {
  CancellationPolicyListItem,
  CancellationPolicyDetail,
  CancellationTierAdmin,
} from "@/types/content-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

export default function CancellationPolicyPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<CancellationPolicyListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] =
    useState<CancellationPolicyDetail | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  async function load(targetPage: number, reset: boolean) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCancellationPoliciesApi(token, targetPage);
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
    load(1, true);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(id);
    setExpandedDetail(null);
    setExpandedLoading(true);
    const res = await getCancellationPolicyDetailApi(token!, id);
    if (res.success && res.data) setExpandedDetail(res.data);
    setExpandedLoading(false);
  }

  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Cancellation Policy</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New version
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Only one policy can be "current" platform-wide at a time. Creating a new
        version replaces the current one and requires a full set of refund tiers
        — past versions stay as immutable history so old bookings keep the tiers
        that applied to them at cancellation time.
      </p>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="space-y-2">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <button
              onClick={() => toggleExpand(p.id)}
              className="w-full text-left p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  {p.name}
                  {p.is_current && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-font-dim">
                  v{p.version} • {p.refund_note}
                </p>
              </div>
              <span className="text-xs text-font-dim">
                {expandedId === p.id ? "Hide" : "View tiers"}
              </span>
            </button>

            {expandedId === p.id && (
              <div className="px-3 pb-3 border-t border-gray-50">
                {expandedLoading ? (
                  <p className="text-xs text-font-dim py-2">Loading tiers...</p>
                ) : expandedDetail ? (
                  <div className="space-y-3 pt-2">
                    {(["FULL", "PARTIAL"] as const).map((mode) => {
                      const modeTiers = expandedDetail.tiers.filter(
                        (t) => t.payment_mode === mode,
                      );
                      if (modeTiers.length === 0) return null;
                      return (
                        <div key={mode}>
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                            {mode === "FULL"
                              ? "Full Payment"
                              : "Partial Payment"}
                          </p>
                          <div className="space-y-1">
                            {modeTiers.map((t, i) => (
                              <div
                                key={i}
                                className="flex justify-between text-xs"
                              >
                                <span>
                                  {t.min_hours_before_pickup}–
                                  {t.max_hours_before_pickup ?? "∞"} hrs
                                </span>
                                <span className="font-semibold">
                                  {t.refund_percentage}% refund
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && !loading && !error && (
          <p className="text-sm text-font-dim text-center py-10">
            No policy versions yet.
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
        <PolicyFormModal
          onClose={() => setShowForm(false)}
          onSaved={(saved) => {
            setItems((prev) => [
              {
                id: saved.id,
                name: saved.name,
                is_current: saved.is_current,
                refund_note: saved.refund_note,
                version: saved.version,
                created_at: saved.created_at,
              },
              ...prev,
            ]);
            setShowForm(false);
          }}
          token={token!}
        />
      )}
    </div>
  );
}

function emptyTier(mode: "FULL" | "PARTIAL"): CancellationTierAdmin {
  return {
    payment_mode: mode,
    min_hours_before_pickup: 0,
    max_hours_before_pickup: null,
    refund_percentage: "0",
    label: "",
    description: "",
  };
}

function PolicyFormModal({
  onClose,
  onSaved,
  token,
}: {
  onClose: () => void;
  onSaved: (p: CancellationPolicyDetail) => void;
  token: string;
}) {
  const [name, setName] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [tiers, setTiers] = useState<CancellationTierAdmin[]>([
    emptyTier("FULL"),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTier(index: number, patch: Partial<CancellationTierAdmin>) {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }
  function addTier() {
    setTiers((prev) => [...prev, emptyTier("FULL")]);
  }
  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (tiers.length === 0) {
      setError("Add at least one tier.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createCancellationPolicyApi(token, {
      name,
      refund_note: refundNote,
      is_current: isCurrent,
      tiers,
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
          New cancellation policy version
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Policy name"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <textarea
          value={refundNote}
          onChange={(e) => setRefundNote(e.target.value)}
          rows={2}
          placeholder="Refund note (shown to customers)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Make this the current policy
        </label>

        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Refund tiers
          </p>
          <div className="space-y-3">
            {tiers.map((t, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <select
                    value={t.payment_mode}
                    onChange={(e) =>
                      updateTier(i, {
                        payment_mode: e.target.value as "FULL" | "PARTIAL",
                      })
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="FULL">Full Payment</option>
                    <option value="PARTIAL">Partial Payment</option>
                  </select>
                  <button
                    onClick={() => removeTier(i)}
                    className="text-xs font-bold text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={t.min_hours_before_pickup}
                    onChange={(e) =>
                      updateTier(i, {
                        min_hours_before_pickup: Number(e.target.value),
                      })
                    }
                    placeholder="Min hrs"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    value={t.max_hours_before_pickup ?? ""}
                    onChange={(e) =>
                      updateTier(i, {
                        max_hours_before_pickup: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Max hrs (blank=∞)"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    value={t.refund_percentage}
                    onChange={(e) =>
                      updateTier(i, { refund_percentage: e.target.value })
                    }
                    placeholder="Refund %"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
                <input
                  value={t.label}
                  onChange={(e) => updateTier(i, { label: e.target.value })}
                  placeholder="Label (optional, auto-generated if blank)"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addTier}
            className="text-sm font-semibold text-brand-yellow-lg mt-2"
          >
            + Add tier
          </button>
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
            disabled={submitting || !name.trim() || !refundNote.trim()}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
