"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setUnauthorizedHandler } from "@/lib/authEvents";
import type { StaffUser } from "@/types/auth.types";
interface AdminAuthContextValue {
  user: StaffUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  // True only after the client has finished reading localStorage on
  // mount. Server-rendered HTML and the client's very first paint
  // both have this false — matching exactly, which is what avoids
  // the hydration mismatch. Consumers should treat "not hydrated yet"
  // as "don't know the real auth state yet," not as "logged out."
  isHydrated: boolean;
  login: (user: StaffUser, token: string, refreshToken: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined,
);
const STORAGE_KEY = "tripzido_admin_auth";

interface StoredAuth {
  user: StaffUser;
  token: string;
  refreshToken: string;
}

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Deliberately start null on BOTH server and client — no
  // localStorage read in the initializer. This is what makes the
  // server render and the client's first paint match exactly.
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Runs once, client-only, after the initial render has already
  // committed and matched the server. Updating state here is a
  // normal post-mount update, not part of hydration, so it can never
  // cause a mismatch — even though it changes what's on screen.
  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
      setRefreshToken(stored.refreshToken);
    }
    setIsHydrated(true);
  }, []);

  function login(user: StaffUser, token: string, refreshToken: string) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, token, refreshToken }),
    );
    setUser(user);
    setToken(token);
    setRefreshToken(refreshToken);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user,
        isHydrated,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
