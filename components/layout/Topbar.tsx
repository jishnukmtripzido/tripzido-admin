"use client";

import { NotificationBell } from "@/components/features/notifications/NotificationBell";

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onOpenMobileMenu} aria-label="Open menu">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="font-heading font-bold">tripzido admin</h1>
      </div>
      <div className="hidden lg:block" />
      <NotificationBell />
    </header>
  );
}
