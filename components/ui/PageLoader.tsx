"use client";

import { Spinner } from "./Spinner";

interface PageLoaderProps {
  /** Use for auth-gate / splash-style checks that happen before any
   * layout chrome exists yet (fills the real device viewport). Omit
   * for a loading state inside an already-mounted page (fills just
   * the content area below the header instead). */
  fullScreen?: boolean;
}

export function PageLoader({ fullScreen = false }: PageLoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex items-center justify-center h-dvh w-full bg-gray-50"
          : "flex-1 flex items-center justify-center py-16"
      }
    >
      <Spinner size="lg" className="text-brand-yellow-lg" />
    </div>
  );
}
