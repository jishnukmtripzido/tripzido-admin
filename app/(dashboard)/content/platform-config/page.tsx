"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getPlatformConfigApi,
  createPlatformConfigApi,
  updatePlatformConfigApi,
  deletePlatformConfigApi,
} from "@/services/content-admin.service";
import type { PlatformConfigAdmin } from "@/types/content-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DATA_TYPES: PlatformConfigAdmin["data_type"][] = [
  "STRING",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "JSON",
];

export default function PlatformConfigPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<PlatformConfigAdmin[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlatformConfigAdmin | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PlatformConfigAdmin | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getPlatformConfigApi(token);
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
    const res = await deletePlatformConfigApi(token, deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      setDeleting(false);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  const filtered = items.filter((c) =>
    c.key.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Platform Config</h1>
        <button
          onClick={() => setEditing("new")}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + New
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Changes here go live immediately — no code deployment needed.
        Double-check the data type matches what the value actually contains.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search keys..."
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-yellow"
      />

      <div className="space-y-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-mono font-semibold truncate">
                {c.key}
              </p>
              <p className="text-xs text-font-dim truncate">{c.value}</p>
              {c.description && (
                <p className="text-xs text-font-dim mt-0.5">{c.description}</p>
              )}
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {c.data_type}
              </span>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setEditing(c)}
                className="text-xs font-bold text-brand-yellow-lg"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(c);
                  setDeleteError(null);
                }}
                className="text-xs font-bold text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-font-dim text-center py-10">
            No config keys found.
          </p>
        )}
      </div>

      {editing && (
        <ConfigFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              editing === "new"
                ? [...prev, saved]
                : prev.map((c) => (c.id === saved.id ? saved : c)),
            );
            setEditing(null);
          }}
          token={token!}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this config key?"
          message="Any code reading this key at runtime will fall back to its hardcoded default, if one exists."
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

function ConfigFormModal({
  initial,
  onClose,
  onSaved,
  token,
}: {
  initial: PlatformConfigAdmin | null;
  onClose: () => void;
  onSaved: (c: PlatformConfigAdmin) => void;
  token: string;
}) {
  const [key, setKey] = useState(initial?.key ?? "");
  const [value, setValue] = useState(initial?.value ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dataType, setDataType] = useState<PlatformConfigAdmin["data_type"]>(
    initial?.data_type ?? "STRING",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const data = { key, value, description, data_type: dataType };
    const res = initial
      ? await updatePlatformConfigApi(token, initial.id, data)
      : await createPlatformConfigApi(token, data);
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
          {initial ? "Edit" : "New"} config key
        </h3>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="KEY_NAME"
          disabled={!!initial}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          placeholder="Value"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
        />
        <select
          value={dataType}
          onChange={(e) =>
            setDataType(e.target.value as PlatformConfigAdmin["data_type"])
          }
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {DATA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
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
            disabled={submitting || !key.trim() || !value.trim()}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
