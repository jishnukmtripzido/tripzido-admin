export interface TaxRateAdmin {
  id: number;
  context: string;
  context_label: string;
  name: string;
  percentage: string;
  cgst_percentage: string;
  sgst_percentage: string;
  igst_percentage: string;
  hsn_sac_code: string;
  is_current: boolean;
  version: number;
  effective_from: string | null;
  created_at: string;
}

export interface PlatformConfigAdmin {
  id: number;
  key: string;
  value: string;
  description: string;
  data_type: "STRING" | "INTEGER" | "DECIMAL" | "BOOLEAN" | "JSON";
}

export interface OfferAdmin {
  id: number;
  title: string;
  description: string;
  icon_type: string;
  icon_type_label: string;
  coupon_code: string;
  discount_amount: string | null;
  min_order_amount: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface PopularRentalAdmin {
  id: number;
  city: number;
  city_name: string;
  pickup_location: number | null;
  pickup_location_name: string | null;
  vehicle_type: number;
  vehicle_type_name: string;
  display_name: string;
  display_price: string | null;
  display_image: string | null;
  tag: string;
  sort_order: number;
}

export interface AnnouncementBannerAdmin {
  id: number;
  content: string;
  page: string;
  page_label: string;
  is_current: boolean;
  is_active: boolean;
}

export interface CancellationTierAdmin {
  id?: number;
  payment_mode: "FULL" | "PARTIAL";
  min_hours_before_pickup: number;
  max_hours_before_pickup: number | null;
  refund_percentage: string;
  label: string;
  description: string;
}

export interface CancellationPolicyListItem {
  id: number;
  name: string;
  is_current: boolean;
  refund_note: string;
  version: number;
  created_at: string;
}

export interface CancellationPolicyDetail extends CancellationPolicyListItem {
  tiers: CancellationTierAdmin[];
}

export interface LegalDocumentAdmin {
  id: number;
  doc_type: string;
  doc_type_label: string;
  version: number;
  content: string;
  is_current: boolean;
  published_at: string | null;
  published_by_name: string | null;
  created_at: string;
}
