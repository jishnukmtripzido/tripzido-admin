"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getStaffApi,
  createStaffApi,
  removeStaffApi,
} from "@/services/users-admin.service";
import type { StaffMember } from "@/types/users-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function StaffPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await getStaffApi(token);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRemove() {
    if (!removeTarget || !token) return;
    setRemoving(true);
    setRemoveError(null);
    const res = await removeStaffApi(token, removeTarget.assignment_id);
    if (!res.success) {
      setRemoveError(res.message || "Failed to remove");
      setRemoving(false);
      return;
    }
    setItems((prev) =>
      prev.filter((s) => s.assignment_id !== removeTarget.assignment_id),
    );
    setRemoveTarget(null);
    setRemoving(false);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Staff</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
        >
          + Add staff
        </button>
      </div>

      <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
        Staff log into this portal with email + password, separate from the OTP
        login customers and vendors use. The last remaining Super Admin can't be
        removed.
      </p>

      <div className="space-y-2">
        {items.map((s) => (
          <div
            key={s.assignment_id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                {s.full_name}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.role === "SUPER_ADMIN"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {s.role_label}
                </span>
              </p>
              <p className="text-xs text-font-dim">
                {s.phone_number} • {s.email || "no email"}
              </p>
            </div>
            <button
              onClick={() => {
                setRemoveTarget(s);
                setRemoveError(null);
              }}
              className="text-xs font-bold text-red-500 shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-font-dim text-center py-10">
            No staff members yet.
          </p>
        )}
      </div>

      {showForm && (
        <StaffFormModal
          onClose={() => setShowForm(false)}
          onCreated={(staff) => {
            setItems((prev) => [staff, ...prev]);
            setShowForm(false);
          }}
          token={token!}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove this staff member's access?"
          message={`${removeTarget.full_name} will no longer be able to log into the admin portal. Their user account itself is not deleted.`}
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

function StaffFormModal({
  onClose,
  onCreated,
  token,
}: {
  onClose: () => void;
  onCreated: (s: StaffMember) => void;
  token: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("SUPPORT");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await createStaffApi(token, {
      phone_number: phoneNumber,
      phone_country_code: "+91",
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role,
    });
    if (!res.success || !res.data) {
      setError(res.message || "Failed to create staff member");
      setSubmitting(false);
      return;
    }
    onCreated(res.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">New staff member</h3>
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
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          <option value="SUPPORT">Support</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
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
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
