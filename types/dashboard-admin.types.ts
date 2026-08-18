import type { AdminBookingListItem } from "./bookings-admin.types";

export interface AdminDashboardData {
  pending_vendor_approvals: number;
  pending_listing_approvals: number;
  revenue_this_month: string;
  revenue_last_month: string;
  revenue_trend_pct: number;
  bookings_this_month: number;
  bookings_last_month: number;
  bookings_trend_pct: number;
  weekly_booking_bars: number[];
  active_vendors: number;
  vendors_this_month: number;
  vendors_last_month: number;
  vendors_trend_pct: number;
  total_customers: number;
  booking_status_counts: Record<string, number>;
  pending_payout_amount: string;
  pending_payout_count: number;
  recent_bookings: AdminBookingListItem[];
  range_label: string;
}
