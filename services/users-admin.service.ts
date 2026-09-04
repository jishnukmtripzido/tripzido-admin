import { api } from "@/lib/api";
import type { PaginatedResponse, ApiResponse } from "@/types/vendor.types";
import type {
  AdminCustomerListItem,
  AdminCustomerDetail,
  StaffMember,
} from "@/types/users-admin.types";

export interface UserLookupResult {
  status: "not_found" | "blocked" | "found_customer";
  reason?: string;
  conflicting_role?: string;
  user?: {
    id: number;
    full_name: string;
    phone_number: string;
    email: string;
    created_at: string;
  };
}

export async function lookupUserApi(
  token: string,
  params: { phone_number?: string; email?: string },
): Promise<ApiResponse<UserLookupResult>> {
  const search = new URLSearchParams();
  if (params.phone_number) search.set("phone_number", params.phone_number);
  if (params.email) search.set("email", params.email);
  return api.get(`/api/users/admin/lookup/?${search.toString()}`, { token });
}

export async function getCustomersApi(
  token: string,
  page: number,
  search?: string,
): Promise<PaginatedResponse<AdminCustomerListItem>> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return api.get(`/api/users/admin/customers/?${params.toString()}`, { token });
}
export async function getCustomerDetailApi(
  token: string,
  id: number,
): Promise<ApiResponse<AdminCustomerDetail>> {
  return api.get(`/api/users/admin/customers/${id}/`, { token });
}
export async function updateCustomerStatusApi(
  token: string,
  id: number,
  statusValue: string,
  reason: string,
): Promise<ApiResponse<AdminCustomerDetail>> {
  return api.patch(
    `/api/users/admin/customers/${id}/status/`,
    { status: statusValue, reason },
    { token },
  );
}

export async function getStaffApi(
  token: string,
  role?: string,
): Promise<ApiResponse<StaffMember[]>> {
  const params = role ? `?role=${role}` : "";
  return api.get(`/api/users/admin/staff/${params}`, { token });
}
export async function createStaffApi(
  token: string,
  data: {
    phone_number: string;
    phone_country_code: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    existing_user_id?: number;
  },
): Promise<ApiResponse<StaffMember>> {
  return api.post(`/api/users/admin/staff/`, data, { token });
}
export async function removeStaffApi(
  token: string,
  assignmentId: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/users/admin/staff/${assignmentId}/`, { token });
}

export async function resetStaffPasswordApi(
  token: string,
  userId: number,
  newPassword: string,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/users/admin/staff/${userId}/password/`,
    { new_password: newPassword },
    { token },
  );
}
