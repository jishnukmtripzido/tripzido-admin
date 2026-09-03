"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getUnreadNotificationCountApi } from "@/services/notifications.service";

const POLL_INTERVAL_MS = 25000;

export function useUnreadNotificationCount(token: string | null) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getUnreadNotificationCountApi(token);
      if (res.success && res.data) setCount(res.data.count);
    } catch {
      // Silent — a failed poll shouldn't surface an error to the
      // user; it just tries again on the next interval.
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refetch();

    function startPolling() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(refetch, POLL_INTERVAL_MS);
    }
    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    function handleVisibility() {
      if (document.hidden) stopPolling();
      else {
        refetch();
        startPolling();
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, refetch]);

  return { count, refetch };
}
