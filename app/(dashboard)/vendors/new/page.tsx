"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { registerVendorApi } from "@/services/vendors.service";

export default function NewVendorPage() {
  const router = useRouter();
  const { token } = useAdminAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    phoneNumber.trim().length === 10 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    businessName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    address.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await registerVendorApi(token, {
        phone_number: phoneNumber,
        phone_country_code: "+91",
        email,
        password,
        business_name: businessName,
        owner_name: ownerName,
        address,
        gst_number: gstNumber,
      });
      if (!res.success || !res.data) {
        setError(res.message || "Failed to register vendor");
        return;
      }
      router.push(`/vendors/${res.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register vendor",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button
        onClick={() => router.push("/vendors")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to vendors
      </button>
      <h1 className="font-heading font-bold text-2xl">Register Vendor</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
          Vendors registered here are approved immediately — no separate
          approval step needed, since you&rsquo;re vetting them directly. They
          can log in right away using the phone number and password set below.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Business Name">
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Owner Name">
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone Number">
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="10-digit number"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        <Field label="Initial Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>

        <Field label="Address">
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
          />
        </Field>

        <Field label="GST Number (optional)">
          <input
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
          />
        </Field>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          className="w-full font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Registering..." : "Register Vendor"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
