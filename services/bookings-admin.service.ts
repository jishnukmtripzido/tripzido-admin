import { api } from "@/lib/api";
import type { PaginatedResponse, ApiResponse } from "@/types/vendor.types";
import type {
  AdminBookingListItem,
  AdminBookingDetail,
} from "@/types/bookings-admin.types";

export async function getAdminBookingsApi(
  token: string,
  page: number,
  statusFilter?: string,
  search?: string,
  vendorId?: number,
): Promise<PaginatedResponse<AdminBookingListItem>> {
  const params = new URLSearchParams({ page: String(page) });
  if (statusFilter) params.set("status", statusFilter);
  if (search) params.set("search", search);
  if (vendorId) params.set("vendor_id", String(vendorId));
  return api.get(`/api/bookings/admin/bookings/?${params.toString()}`, {
    token,
  });
}

export async function getAdminBookingDetailApi(
  token: string,
  id: number,
): Promise<ApiResponse<AdminBookingDetail>> {
  return api.get(`/api/bookings/admin/bookings/${id}/`, { token });
}
