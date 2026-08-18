"use client";

import { Spinner } from "./Spinner";

export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <Spinner size="sm" className="text-brand-yellow-lg" />
    </div>
  );
}
