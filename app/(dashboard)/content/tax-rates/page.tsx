"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getTaxRatesApi,
  createTaxRateApi,
} from "@/services/content-admin.service";
import type { TaxRateAdmin } from "@/types/content-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

const CONTEXT_TABS = [
  { key: "", label: "All" },
  { key: "VENDOR_RENTAL", label: "Vendor Rental" },
  { key: "PLATFORM_COMMISSION", label: "Platform Commission" },
];

export default function TaxRatesPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<TaxRateAdmin[]>([]);
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
      const res = await getTaxRatesApi(token, targetPage, tab || undefined);
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
        <h1 className="font-heading font-bold text-2xl">Tax Rates</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New version
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Tax rates are versioned — creating a new one for a context automatically
        supersedes the previous "current" rate. Past rows stay as immutable
        history, so old bookings keep the rate that actually applied to them.
      </p>

      <div className="flex gap-2">
        {CONTEXT_TABS.map((t) => (
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
        {items.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                {t.name}
                {t.is_current && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Current
                  </span>
                )}
              </p>
              <p className="text-xs text-font-dim">
                {t.context_label} • v{t.version} • {t.percentage}%
              </p>
              {t.hsn_sac_code && (
                <p className="text-xs text-font-dim">
                  HSN/SAC: {t.hsn_sac_code}
                </p>
              )}
            </div>
            <span className="text-xs text-font-dim">
              {new Date(t.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && !error && (
        <p className="text-sm text-font-dim text-center py-10">
          No tax rates found.
        </p>
      )}
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
        <TaxRateFormModal
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

function TaxRateFormModal({
  onClose,
  onSaved,
  token,
}: {
  onClose: () => void;
  onSaved: (t: TaxRateAdmin) => void;
  token: string;
}) {
  const [context, setContext] = useState("VENDOR_RENTAL");
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [cgst, setCgst] = useState("0");
  const [sgst, setSgst] = useState("0");
  const [igst, setIgst] = useState("0");
  const [hsnCode, setHsnCode] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const data = {
      context,
      name,
      percentage,
      cgst_percentage: cgst,
      sgst_percentage: sgst,
      igst_percentage: igst,
      hsn_sac_code: hsnCode,
      is_current: isCurrent,
      effective_from: effectiveFrom || null,
    };
    const res = await createTaxRateApi(token, data);
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
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-heading font-bold text-base">
          New tax rate version
        </h3>
        <select
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          <option value="VENDOR_RENTAL">Vendor Rental Service</option>
          <option value="PLATFORM_COMMISSION">
            Platform Commission Service
          </option>
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name, e.g. GST 18%"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          placeholder="Overall percentage"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            value={cgst}
            onChange={(e) => setCgst(e.target.value)}
            placeholder="CGST %"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            value={sgst}
            onChange={(e) => setSgst(e.target.value)}
            placeholder="SGST %"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            value={igst}
            onChange={(e) => setIgst(e.target.value)}
            placeholder="IGST %"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <input
          value={hsnCode}
          onChange={(e) => setHsnCode(e.target.value)}
          placeholder="HSN/SAC code (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 accent-brand-yellow"
          />
          Make this the current rate for this context
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
            disabled={submitting || !name.trim() || !percentage}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
