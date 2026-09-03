export type NotificationPortal = "VENDOR" | "ADMIN";

export interface NotificationItem {
  id: number;
  portal: NotificationPortal;
  notification_type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedNotifications {
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
  results: NotificationItem[];
}
