export type AdminListingStatus =
  | "PENDING"
  | "APPROVED"
  | "PAUSED"
  | "SUSPENDED"
  | "REJECTED";

export interface AdminListingListItem {
  id: number;
  vendor_name: string;
  vehicle_type_name: string;
  vehicle_type_image: string | null;
  location_name: string;
  quantity: number;
  status: AdminListingStatus;
  status_label: string;
  created_at: string;
}

export interface AdminListingImage {
  id: number;
  image_url: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface AdminListingPackage {
  id: number;
  name: string;
  category: string;
  duration_hours: string;
  price: string;
  pay_at_pickup_enabled: boolean;
  km_limit: number | null;
}

export interface AdminListingScheduleDay {
  day_of_week: number;
  is_closed: boolean;
  timing: string;
}

export interface AdminListingDetail {
  id: number;
  status: AdminListingStatus;
  rejection_reason: string;
  suspension_reason: string;
  available_count: number;
  vendor_id: number;
  vendor_name: string;
  vehicle_type_id: number;
  vehicle_type_name: string;
  vehicle_type_image: string | null;
  pickup_location_name: string;
  pickup_point_address: string | null;
  schedule_template_name: string | null;
  schedule_days: AdminListingScheduleDay[];
  images: AdminListingImage[];
  pricing_packages: AdminListingPackage[];
  security_deposit_amount: string;
  km_limit_per_day: number | null;
  excess_charge_per_km: string | null;
  late_return_penalty_per_hour: string | null;
  doorstep_delivery_enabled: boolean;
  approved_by_name: string | null;
  approved_at: string | null;
  suspended_by_name: string | null;
  suspended_at: string | null;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface VehicleTypeAdmin {
  id: number;
  name: string;
  brand: number;
  brand_name: string;
  make_year: number;
  transmission_type: string;
  vehicle_type: string;
  fuel_type: string;
  primary_image: string | null;
  seats: number;
  cc: number;
  top_speed_kmph: number | null;
  fuel_capacity_litres: string | null;
  weight_kg: string | null;
  mileage_kmpl: string | null;
  is_published: boolean;
}

export interface PackageCategory {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface PricingPackageTypeAdmin {
  id: number;
  category: number;
  category_name: string;
  name: string;
  description: string;
  duration_hours: string;
  sort_order: number;
}
