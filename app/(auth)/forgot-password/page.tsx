"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  sendStaffForgotPasswordOtpApi,
  resetStaffForgotPasswordApi,
} from "@/services/auth.service";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSendOtp = email.includes("@") && !isSubmitting;
  const canVerifyOtp = otp.join("").length === 4 && !isSubmitting;
  const canReset =
    newPassword.length >= 8 && newPassword === confirmPassword && !isSubmitting;

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleSendOtp() {
    if (!canSendOtp) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await sendStaffForgotPasswordOtpApi(email);
      if (!res.success) {
        setError(res.message || "Failed to send code");
        return;
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOtpContinue() {
    if (!canVerifyOtp) return;
    setStep("password");
    setError(null);
  }

  async function handleReset() {
    if (!canReset) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const code = otp.join("");
      const res = await resetStaffForgotPasswordApi(email, code, newPassword);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to reset password");
        setStep("otp");
        setOtp(["", "", "", ""]);
        return;
      }
      login(
        {
          email: res.data.email,
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          role: res.data.role,
        },
        res.data.access_token,
        res.data.refresh_token,
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="font-heading font-extrabold text-2xl mb-1">
          Reset password
        </h1>

        {step === "email" && (
          <>
            <p className="text-sm text-font-dim mb-6">
              Enter your staff email — we&rsquo;ll send a code there.
            </p>
            <input
              type="email"
              placeholder="you@tripzido.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
            {error && (
              <p className="text-sm text-red-500 font-medium mt-4">{error}</p>
            )}
            <button
              onClick={handleSendOtp}
              disabled={!canSendOtp}
              className="w-full mt-6 font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send code"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="text-sm text-font-dim mb-6">
              Enter the 4-digit code sent to{" "}
              <span className="font-semibold text-font-main-sub">{email}</span>.
            </p>
            <div className="flex gap-2 justify-center mb-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-12 text-center text-lg font-bold rounded-xl border-2 border-gray-200 outline-none focus:border-brand-yellow"
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium mt-2 text-center">
                {error}
              </p>
            )}
            <button
              onClick={handleOtpContinue}
              disabled={!canVerifyOtp}
              className="w-full mt-6 font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
            >
              Continue
            </button>
            <button
              onClick={() => {
                setStep("email");
                setOtp(["", "", "", ""]);
                setError(null);
              }}
              className="w-full text-xs font-semibold text-font-dim py-2 mt-1"
            >
              Change email
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <p className="text-sm text-font-dim mb-6">
              Choose a new password (at least 8 characters).
            </p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
              />
              {confirmPassword.length > 0 &&
                newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">
                    Passwords don&rsquo;t match.
                  </p>
                )}
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium mt-4">{error}</p>
            )}
            <button
              onClick={handleReset}
              disabled={!canReset}
              className="w-full mt-6 font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Reset password & sign in"}
            </button>
          </>
        )}

        <p className="text-center text-xs font-semibold text-font-dim mt-6">
          <Link href="/login" className="text-brand-yellow-lg hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
