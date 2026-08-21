export type VendorStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BANNED";

export interface VendorListItem {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  gst_number: string;
  status: VendorStatus;
  status_label: string;
  created_at: string;
}

export interface VendorSubscriptionSummary {
  id: number;
  plan_name: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
}

export interface VendorDetail {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  gst_number: string;
  logo_image: string | null;
  status: VendorStatus;
  status_label: string;
  rejection_reason: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  suspended_by_name: string | null;
  suspended_at: string | null;
  suspension_reason: string;
  banned_by_name: string | null;
  banned_at: string | null;
  ban_reason: string;
  current_subscription: VendorSubscriptionSummary | null;
  created_at: string;
}

export interface VendorDocument {
  id: number;
  doc_type: string;
  doc_type_label: string;
  file: string;
  original_filename: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  status_label: string;
  rejection_reason: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface VendorBankAccount {
  id: number;
  account_holder_name: string;
  account_number_masked: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUPERSEDED";
  status_label: string;
  is_active_acc: boolean;
  rejection_reason: string;
  verified_by_name: string | null;
  verified_at: string | null;
  submitted_at: string;
}

export interface VendorCommission {
  id: number;
  name: string;
  commission_type: string;
  flat_percentage: string | null;
  description: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  billing_cycle: string;
  price: string;
  commission: number;
  commission_name: string;
  max_listings: number | null;
  max_pickup_locations: number | null;
  max_images_per_listing: number;
  can_enable_partial_payment: boolean;
  can_access_analytics: boolean;
  can_respond_to_reviews: boolean;
  priority_listing: boolean;
  is_default: boolean;
  sort_order: number;
}

export interface VendorSubscriptionRecord {
  id: number;
  plan: number;
  plan_name: string;
  status: string;
  status_label: string;
  started_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  is_current: boolean;
  is_manually_assigned: boolean;
  assigned_by_name: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data?: {
    pagination: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      next: string | null;
      previous: string | null;
    };
    results: T[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]> | string;
}

export interface VendorTeamMember {
  id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  added_at: string;
  added_by_name: string | null;
}
