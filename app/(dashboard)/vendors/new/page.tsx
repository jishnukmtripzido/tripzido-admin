// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAdminAuth } from "@/context/AdminAuthContext";
// import { registerVendorApi } from "@/services/vendors.service";

// export default function NewVendorPage() {
//   const router = useRouter();
//   const { token } = useAdminAuth();

//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [businessName, setBusinessName] = useState("");
//   const [ownerName, setOwnerName] = useState("");
//   const [address, setAddress] = useState("");
//   const [gstNumber, setGstNumber] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const canSubmit =
//     phoneNumber.trim().length === 10 &&
//     email.trim().length > 0 &&
//     password.length >= 8 &&
//     businessName.trim().length > 0 &&
//     ownerName.trim().length > 0 &&
//     address.trim().length > 0;

//   async function handleSubmit() {
//     if (!canSubmit || !token) return;
//     setSubmitting(true);
//     setError(null);
//     try {
//       const res = await registerVendorApi(token, {
//         phone_number: phoneNumber,
//         phone_country_code: "+91",
//         email,
//         password,
//         business_name: businessName,
//         owner_name: ownerName,
//         address,
//         gst_number: gstNumber,
//       });
//       if (!res.success || !res.data) {
//         setError(res.message || "Failed to register vendor");
//         return;
//       }
//       router.push(`/vendors/${res.data.id}`);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Failed to register vendor",
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div className="max-w-xl mx-auto space-y-5">
//       <button
//         onClick={() => router.push("/vendors")}
//         className="text-sm font-semibold text-font-dim"
//       >
//         ← Back to vendors
//       </button>
//       <h1 className="font-heading font-bold text-2xl">Register Vendor</h1>

//       <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
//         <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
//           Vendors registered here are approved immediately — no separate
//           approval step needed, since you&rsquo;re vetting them directly. They
//           can log in right away using the phone number and password set below.
//         </p>

//         <div className="grid grid-cols-2 gap-4">
//           <Field label="Business Name">
//             <input
//               value={businessName}
//               onChange={(e) => setBusinessName(e.target.value)}
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//             />
//           </Field>
//           <Field label="Owner Name">
//             <input
//               value={ownerName}
//               onChange={(e) => setOwnerName(e.target.value)}
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//             />
//           </Field>
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <Field label="Phone Number">
//             <input
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               placeholder="10-digit number"
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//             />
//           </Field>
//           <Field label="Email">
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//             />
//           </Field>
//         </div>

//         <Field label="Initial Password">
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Min 8 characters"
//             className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//           />
//         </Field>

//         <Field label="Address">
//           <textarea
//             value={address}
//             onChange={(e) => setAddress(e.target.value)}
//             rows={3}
//             className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
//           />
//         </Field>

//         <Field label="GST Number (optional)">
//           <input
//             value={gstNumber}
//             onChange={(e) => setGstNumber(e.target.value)}
//             className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//           />
//         </Field>

//         {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

//         <button
//           onClick={handleSubmit}
//           disabled={submitting || !canSubmit}
//           className="w-full font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
//         >
//           {submitting ? "Registering..." : "Register Vendor"}
//         </button>
//       </div>
//     </div>
//   );
// }

// function Field({
//   label,
//   children,
// }: {
//   label: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-gray-600 mb-1">
//         {label}
//       </label>
//       {children}
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { registerVendorApi } from "@/services/vendors.service";
import {
  lookupUserApi,
  type UserLookupResult,
} from "@/services/users-admin.service";

type LookupState =
  | "idle"
  | "checking"
  | "not_found"
  | "blocked"
  | "found_customer";

export default function NewVendorPage() {
  const router = useRouter();
  const { token } = useAdminAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupResult, setLookupResult] = useState<UserLookupResult | null>(
    null,
  );
  const [useExisting, setUseExisting] = useState(false);

  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheck = phoneNumber.trim().length === 10 && email.trim().length > 0;

  async function handleCheck() {
    if (!token || !canCheck) return;
    setLookupState("checking");
    setError(null);
    setUseExisting(false);
    try {
      const res = await lookupUserApi(token, {
        phone_number: phoneNumber,
        email,
      });
      if (!res.success || !res.data) {
        setError(res.message || "Failed to check");
        setLookupState("idle");
        return;
      }
      setLookupResult(res.data);
      setLookupState(res.data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check");
      setLookupState("idle");
    }
  }

  function handleReset() {
    setLookupState("idle");
    setLookupResult(null);
    setUseExisting(false);
  }

  const showForm =
    lookupState === "not_found" ||
    (lookupState === "found_customer" && useExisting);
  const canSubmit =
    showForm &&
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
        existing_user_id:
          lookupState === "found_customer" ? lookupResult?.user?.id : undefined,
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone Number">
            <input
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                handleReset();
              }}
              placeholder="10-digit number"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleReset();
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>
        </div>

        {lookupState === "idle" && (
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            className="w-full font-bold rounded-xl py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Check phone / email
          </button>
        )}

        {lookupState === "checking" && (
          <p className="text-sm text-font-dim text-center py-2">Checking...</p>
        )}

        {lookupState === "blocked" && lookupResult && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">
              {lookupResult.reason}
            </p>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-red-600 mt-2 underline"
            >
              Try a different phone/email
            </button>
          </div>
        )}

        {lookupState === "found_customer" &&
          lookupResult?.user &&
          !useExisting && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">
                Existing customer found — no privileged role, eligible to become
                a vendor.
              </p>
              <div className="text-sm text-blue-800">
                <p>
                  <strong>{lookupResult.user.full_name}</strong>
                </p>
                <p>
                  {lookupResult.user.phone_number} • {lookupResult.user.email}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Joined{" "}
                  {new Date(lookupResult.user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setUseExisting(true)}
                  className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg"
                >
                  Use this account
                </button>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-blue-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        {showForm && (
          <>
            {lookupState === "not_found" && (
              <p className="text-xs text-font-dim bg-gray-50 rounded-xl p-3">
                No existing account — a new one will be created.
              </p>
            )}
            {lookupState === "found_customer" && useExisting && (
              <p className="text-xs text-blue-700 bg-blue-50 rounded-xl p-3">
                Adding Vendor access to {lookupResult?.user?.full_name}&rsquo;s
                existing account.
              </p>
            )}

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

            <Field
              label={
                lookupState === "found_customer"
                  ? "Set New Password"
                  : "Initial Password"
              }
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-500 mt-1">
                  Password must be at least 8 characters.
                </p>
              )}
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

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="w-full font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Register Vendor"}
            </button>
          </>
        )}

        {lookupState === "idle" && error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
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
