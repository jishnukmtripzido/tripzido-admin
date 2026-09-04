// "use client";

// import { useEffect, useState } from "react";
// import { useAdminAuth } from "@/context/AdminAuthContext";
// import {
//   getStaffApi,
//   createStaffApi,
//   removeStaffApi,
//   resetStaffPasswordApi,
// } from "@/services/users-admin.service";
// import type { StaffMember } from "@/types/users-admin.types";
// import { PageLoader } from "@/components/ui/PageLoader";
// import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// export default function StaffPage() {
//   const { token } = useAdminAuth();
//   const [items, setItems] = useState<StaffMember[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
//   const [removing, setRemoving] = useState(false);
//   const [removeError, setRemoveError] = useState<string | null>(null);
//   const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);

//   async function load() {
//     if (!token) return;
//     setLoading(true);
//     const res = await getStaffApi(token);
//     if (res.success && res.data) setItems(res.data);
//     setLoading(false);
//   }
//   useEffect(() => {
//     load();
//   }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

//   async function handleRemove() {
//     if (!removeTarget || !token) return;
//     setRemoving(true);
//     setRemoveError(null);
//     const res = await removeStaffApi(token, removeTarget.assignment_id);
//     if (!res.success) {
//       setRemoveError(res.message || "Failed to remove");
//       setRemoving(false);
//       return;
//     }
//     setItems((prev) =>
//       prev.filter((s) => s.assignment_id !== removeTarget.assignment_id),
//     );
//     setRemoveTarget(null);
//     setRemoving(false);
//   }

//   if (loading) return <PageLoader />;

//   return (
//     <div className="max-w-3xl mx-auto space-y-4">
//       <div className="flex items-center justify-between">
//         <h1 className="font-heading font-bold text-2xl">Staff</h1>
//         <button
//           onClick={() => setShowForm(true)}
//           className="text-sm font-bold text-brand-secondary bg-brand-yellow px-4 py-2 rounded-lg"
//         >
//           + Add staff
//         </button>
//       </div>

//       <p className="text-xs text-font-dim bg-blue-50 border border-blue-200 rounded-xl p-3">
//         Staff log into this portal with email + password, separate from the OTP
//         login customers and vendors use. The last remaining Super Admin can't be
//         removed.
//       </p>

//       <div className="space-y-2">
//         {items.map((s) => (
//           <div
//             key={s.assignment_id}
//             className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between gap-3"
//           >
//             <div>
//               <p className="text-sm font-semibold flex items-center gap-2">
//                 {s.full_name}
//                 <span
//                   className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
//                     s.role === "SUPER_ADMIN"
//                       ? "bg-purple-100 text-purple-700"
//                       : "bg-blue-100 text-blue-700"
//                   }`}
//                 >
//                   {s.role_label}
//                 </span>
//               </p>
//               <p className="text-xs text-font-dim">
//                 {s.phone_number} • {s.email || "no email"}
//               </p>
//             </div>
//             <div className="flex gap-3 shrink-0">
//               <button
//                 onClick={() => setResetTarget(s)}
//                 className="text-xs font-bold text-brand-yellow-lg"
//               >
//                 Reset password
//               </button>
//               <button
//                 onClick={() => {
//                   setRemoveTarget(s);
//                   setRemoveError(null);
//                 }}
//                 className="text-xs font-bold text-red-500"
//               >
//                 Remove
//               </button>
//             </div>
//           </div>
//         ))}
//         {items.length === 0 && (
//           <p className="text-sm text-font-dim text-center py-10">
//             No staff members yet.
//           </p>
//         )}
//       </div>

//       {showForm && (
//         <StaffFormModal
//           onClose={() => setShowForm(false)}
//           onCreated={(staff) => {
//             setItems((prev) => [staff, ...prev]);
//             setShowForm(false);
//           }}
//           token={token!}
//         />
//       )}

//       {resetTarget && (
//         <ResetPasswordModal
//           staff={resetTarget}
//           onClose={() => setResetTarget(null)}
//           token={token!}
//         />
//       )}

//       {removeTarget && (
//         <ConfirmDialog
//           title="Remove this staff member's access?"
//           message={`${removeTarget.full_name} will no longer be able to log into the admin portal. Their user account itself is not deleted.`}
//           confirmLabel="Remove"
//           destructive
//           submitting={removing}
//           error={removeError}
//           onCancel={() => setRemoveTarget(null)}
//           onConfirm={handleRemove}
//         />
//       )}
//     </div>
//   );
// }

// function StaffFormModal({
//   onClose,
//   onCreated,
//   token,
// }: {
//   onClose: () => void;
//   onCreated: (s: StaffMember) => void;
//   token: string;
// }) {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [role, setRole] = useState("SUPPORT");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   async function handleSubmit() {
//     setSubmitting(true);
//     setError(null);
//     try {
//       const res = await createStaffApi(token, {
//         phone_number: phoneNumber,
//         phone_country_code: "+91",
//         email,
//         password,
//         first_name: firstName,
//         last_name: lastName,
//         role,
//       });
//       if (!res.success || !res.data) {
//         setError(res.message || "Failed to create staff member");
//         return;
//       }
//       onCreated(res.data);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Failed to create staff member",
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
//       <div onClick={onClose} className="absolute inset-0 bg-black/50" />
//       <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
//         <h3 className="font-heading font-bold text-base">New staff member</h3>
//         <div className="grid grid-cols-2 gap-3">
//           <input
//             value={firstName}
//             onChange={(e) => setFirstName(e.target.value)}
//             placeholder="First name"
//             className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//           />
//           <input
//             value={lastName}
//             onChange={(e) => setLastName(e.target.value)}
//             placeholder="Last name"
//             className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//           />
//         </div>
//         <input
//           value={phoneNumber}
//           onChange={(e) => setPhoneNumber(e.target.value)}
//           placeholder="Phone number"
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Email"
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Password (min 8 characters)"
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//         />
//         <select
//           value={role}
//           onChange={(e) => setRole(e.target.value)}
//           className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
//         >
//           <option value="SUPPORT">Support</option>
//           <option value="SUPER_ADMIN">Super Admin</option>
//         </select>
//         {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
//         <div className="flex gap-3">
//           <button
//             onClick={onClose}
//             disabled={submitting}
//             className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={
//               submitting ||
//               !phoneNumber.trim() ||
//               !email.trim() ||
//               password.length < 8
//             }
//             className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
//           >
//             {submitting ? "Creating..." : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ResetPasswordModal({
//   staff,
//   onClose,
//   token,
// }: {
//   staff: StaffMember;
//   onClose: () => void;
//   token: string;
// }) {
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);

//   const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword;

//   async function handleSubmit() {
//     if (!canSubmit) return;
//     setSubmitting(true);
//     setError(null);
//     try {
//       const res = await resetStaffPasswordApi(
//         token,
//         staff.user_id,
//         newPassword,
//       );
//       if (!res.success) {
//         setError(res.message || "Failed to reset password");
//         return;
//       }
//       setSuccess(true);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to reset password");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
//       <div onClick={onClose} className="absolute inset-0 bg-black/50" />
//       <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
//         <h3 className="font-heading font-bold text-base">
//           Reset password for {staff.full_name}
//         </h3>

//         {success ? (
//           <>
//             <p className="text-sm text-green-600 font-medium">
//               Password updated successfully.
//             </p>
//             <button
//               onClick={onClose}
//               className="w-full rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary"
//             >
//               Done
//             </button>
//           </>
//         ) : (
//           <>
//             <input
//               type="password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               placeholder="New password (min 8 characters)"
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//             />
//             <input
//               type="password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               placeholder="Confirm new password"
//               className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
//             />
//             {confirmPassword.length > 0 && newPassword !== confirmPassword && (
//               <p className="text-xs text-red-500">
//                 Passwords don&rsquo;t match.
//               </p>
//             )}
//             {error && (
//               <p className="text-sm text-red-500 font-medium">{error}</p>
//             )}
//             <div className="flex gap-3">
//               <button
//                 onClick={onClose}
//                 disabled={submitting}
//                 className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={submitting || !canSubmit}
//                 className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
//               >
//                 {submitting ? "Saving..." : "Reset Password"}
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getStaffApi,
  createStaffApi,
  removeStaffApi,
  resetStaffPasswordApi,
} from "@/services/users-admin.service";
import {
  lookupUserApi,
  type UserLookupResult,
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
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);

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
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setResetTarget(s)}
                className="text-xs font-bold text-brand-yellow-lg"
              >
                Reset password
              </button>
              <button
                onClick={() => {
                  setRemoveTarget(s);
                  setRemoveError(null);
                }}
                className="text-xs font-bold text-red-500"
              >
                Remove
              </button>
            </div>
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

      {resetTarget && (
        <ResetPasswordModal
          staff={resetTarget}
          onClose={() => setResetTarget(null)}
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
  const [lookupState, setLookupState] = useState<
    "idle" | "checking" | "not_found" | "blocked" | "found_customer"
  >("idle");
  const [lookupResult, setLookupResult] = useState<UserLookupResult | null>(
    null,
  );
  const [useExisting, setUseExisting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SUPPORT");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheck = phoneNumber.trim().length === 10 && email.trim().length > 0;

  async function handleCheck() {
    setLookupState("checking");
    setError(null);
    setUseExisting(false);
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
  }

  function handleReset() {
    setLookupState("idle");
    setLookupResult(null);
    setUseExisting(false);
  }

  const showForm =
    lookupState === "not_found" ||
    (lookupState === "found_customer" && useExisting);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createStaffApi(token, {
        existing_user_id:
          lookupState === "found_customer" ? lookupResult?.user?.id : undefined,
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
        return;
      }
      onCreated(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create staff member",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">New staff member</h3>

        <input
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            handleReset();
          }}
          placeholder="Phone number"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            handleReset();
          }}
          placeholder="Email"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
        />

        {lookupState === "idle" && (
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            className="w-full font-bold rounded-xl py-2.5 bg-gray-100 text-gray-700 disabled:opacity-50"
          >
            Check phone / email
          </button>
        )}
        {lookupState === "checking" && (
          <p className="text-sm text-font-dim text-center">Checking...</p>
        )}

        {lookupState === "blocked" && lookupResult && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-red-700">
              {lookupResult.reason}
            </p>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-red-600 mt-1 underline"
            >
              Try different phone/email
            </button>
          </div>
        )}

        {lookupState === "found_customer" &&
          lookupResult?.user &&
          !useExisting && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-900">
                Existing customer found — eligible for staff access.
              </p>
              <p className="text-xs text-blue-800">
                {lookupResult.user.full_name} · {lookupResult.user.phone_number}{" "}
                · {lookupResult.user.email}
              </p>
              <div className="flex gap-2">
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
          </>
        )}

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
          >
            Cancel
          </button>
          {showForm && (
            <button
              onClick={handleSubmit}
              disabled={submitting || password.length < 8}
              className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  staff,
  onClose,
  token,
}: {
  staff: StaffMember;
  onClose: () => void;
  token: string;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await resetStaffPasswordApi(
        token,
        staff.user_id,
        newPassword,
      );
      if (!res.success) {
        setError(res.message || "Failed to reset password");
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-bold text-base">
          Reset password for {staff.full_name}
        </h3>

        {success ? (
          <>
            <p className="text-sm text-green-600 font-medium">
              Password updated successfully.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">
                Passwords don&rsquo;t match.
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
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
                disabled={submitting || !canSubmit}
                className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
