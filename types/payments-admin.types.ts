export interface AdminPayment {
  id: number;
  booking: number;
  booking_reference: string;
  vendor_name: string;
  payment_type: string;
  payment_type_label: string;
  amount: string;
  gateway: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  status: string;
  status_label: string;
  attempt_number: number;
  initiated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string;
  webhook_received_at: string | null;
  is_reconciled: boolean;
}

export interface EligibleBooking {
  id: number;
  booking_reference: string;
  vendor_id: number;
  vendor_name: string;
  vehicle_name: string;
  dropoff_date: string;
  net_amount: string;
}

export interface VendorPayoutListItem {
  id: number;
  vendor: number;
  vendor_name: string;
  status: string;
  status_label: string;
  total_amount: string;
  items_count: number;
  period_start: string | null;
  period_end: string | null;
  utr_number: string;
  paid_at: string | null;
  created_at: string;
}

export interface VendorPayoutItemDetail {
  id: number;
  booking_id: number;
  booking_reference: string;
  vehicle_name: string;
  pickup_date: string;
  dropoff_date: string;
  amount: string;
}

export interface VendorPayoutDetail {
  id: number;
  vendor: number;
  vendor_name: string;
  status: string;
  status_label: string;
  total_amount: string;
  period_start: string | null;
  period_end: string | null;
  bank_account_snapshot: Record<string, string>;
  utr_number: string;
  paid_at: string | null;
  paid_by_name: string | null;
  note: string;
  items: VendorPayoutItemDetail[];
  created_at: string;
}
