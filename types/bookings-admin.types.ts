export interface AdminBookingListItem {
  id: number;
  booking_reference: string;
  vendor_name: string;
  customer_name: string;
  vehicle_name: string;
  pickup_date: string;
  dropoff_date: string;
  status: string;
  status_label: string;
  payment_mode: string;
  payment_mode_label: string;
  is_offline: boolean;
  net_amount: string;
  created_at: string;
}

export interface AdminPaymentSummary {
  id: number;
  payment_type: string;
  amount: string;
  status: string;
  gateway_order_id: string;
  initiated_at: string;
  completed_at: string | null;
}

export interface AdminBookingCancellation {
  reason_code: string;
  reason_text: string;
  cancelled_by_role: string;
  hours_before_pickup_at_cancellation: string | null;
  refund_percentage: string;
  refundable_amount: string;
  forfeited_amount: string;
  created_at: string;
}

export interface AdminBookingDetail {
  id: number;
  booking_reference: string;
  booking_group_id: string;
  vendor_id: number;
  vendor_name: string;
  customer_name: string;
  customer_phone: string;
  vehicle_name: string;
  pickup_location_name: string;
  pickup_date: string;
  pickup_time: string;
  dropoff_date: string;
  dropoff_time: string;
  status: string;
  status_label: string;
  payment_mode: string;
  payment_mode_label: string;
  is_offline: boolean;
  listing_amount: string;
  commission_amount: string;
  net_commission_amount: string;
  net_amount: string;
  advance_amount: string;
  remaining_amount: string;
  security_deposit_amount: string;
  vendor_tax_percentage: string;
  vendor_tax_amount: string;
  commission_tax_percentage: string;
  commission_tax_amount: string;
  handed_over_at: string | null;
  returned_at: string | null;
  cancelled_at: string | null;
  cancelled_by_role: string;
  payments: AdminPaymentSummary[];
  cancellation: AdminBookingCancellation | null;
  created_at: string;
}
