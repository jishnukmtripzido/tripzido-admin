export interface AdminCustomerListItem {
  id: number;
  phone_number: string;
  full_name: string;
  email: string | null;
  status: string;
  status_label: string;
  created_at: string;
}

export interface AdminCustomerDetail {
  id: number;
  phone_number: string;
  phone_country_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  address: string;
  status: string;
  status_label: string;
  suspended_at: string | null;
  suspension_reason: string;
  banned_at: string | null;
  ban_reason: string;
  is_phone_blocked: boolean;
  created_at: string;
}

export interface StaffMember {
  assignment_id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: string;
  role_label: string;
  assigned_at?: string;
  assigned_by_name?: string | null;
}
