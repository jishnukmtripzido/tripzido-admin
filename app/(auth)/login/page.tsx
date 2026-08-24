"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { staffLoginApi } from "@/services/auth.service";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await staffLoginApi(email, password);
      if (!res.success || !res.data) {
        setError(res.message || "Login failed");
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      >
        <h1 className="font-heading font-extrabold text-2xl mb-1">
          Tripzido Admin
        </h1>
        <p className="text-sm text-font-dim mb-6">
          Sign in with your staff account.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-yellow"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand-yellow-lg hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium mt-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 font-bold rounded-xl py-3.5 bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
