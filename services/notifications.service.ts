import { api } from "@/lib/api";
import type { PaginatedNotifications } from "@/types/notification.types";

export async function getNotificationsApi(
  token: string,
  page: number = 1,
  unreadOnly: boolean = false,
) {
  const params = new URLSearchParams({ page: String(page) });
  if (unreadOnly) params.set("unread_only", "true");
  return api.get<{
    success: boolean;
    message: string;
    data?: PaginatedNotifications;
  }>(`/api/notifications/?${params.toString()}`, { token });
}

export async function getUnreadNotificationCountApi(token: string) {
  return api.get<{
    success: boolean;
    message: string;
    data?: { count: number };
  }>("/api/notifications/unread-count/", { token });
}

export async function markNotificationReadApi(token: string, id: number) {
  return api.patch<{ success: boolean; message: string }>(
    `/api/notifications/${id}/read/`,
    {},
    { token },
  );
}

export async function markAllNotificationsReadApi(token: string) {
  return api.post<{ success: boolean; message: string }>(
    "/api/notifications/mark-all-read/",
    {},
    { token },
  );
}
