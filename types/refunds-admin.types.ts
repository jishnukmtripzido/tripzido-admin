export interface RefundRecord {
  id: number;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  vendor_name: string;
  reason_label: string;
  amount: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
  status_label: string;
  reference_number: string;
  processed_at: string | null;
  processed_by_name: string | null;
  note: string;
  cancelled_at: string;
  created_at: string;
}
