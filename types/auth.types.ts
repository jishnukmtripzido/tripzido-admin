export type StaffRole = "SUPER_ADMIN" | "SUPPORT";

export interface StaffUser {
  email: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
}

export interface StaffLoginResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    role: StaffRole;
    first_name: string;
    last_name: string;
    email: string;
  };
}
