"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "@/services/notifications.service";
import type { NotificationItem } from "@/types/notification.types";
import { useAdminAuth } from "@/context/AdminAuthContext";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const { count, refetch } = useUnreadNotificationCount(token);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && token) {
      setLoading(true);
      try {
        const res = await getNotificationsApi(token, 1);
        if (res.success && res.data) setItems(res.data.results);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleItemClick(item: NotificationItem) {
    if (!token) return;
    if (!item.is_read) {
      markNotificationReadApi(token, item.id).catch(() => {});
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
      );
      refetch();
    }
    setOpen(false);
    if (item.link) router.push(item.link as never);
  }

  async function handleMarkAllRead() {
    if (!token) return;
    await markAllNotificationsReadApi(token).catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refetch();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative p-2 bg-gray-50 rounded-full border border-gray-100 text-gray-600 hover:text-brand-secondary transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 sticky top-0 bg-white">
            <p className="text-sm font-heading font-bold">Notifications</p>
            {items.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand-yellow-lg"
              >
                Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-font-dim text-center py-8">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-font-dim text-center py-8">
              No notifications yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${
                    !item.is_read ? "bg-brand-yellow/5" : ""
                  }`}
                >
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-brand-yellow mt-1.5 shrink-0" />
                  )}
                  <div className={`min-w-0 ${item.is_read ? "pl-4.5" : ""}`}>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.title}
                    </p>
                    {item.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {timeAgo(item.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
