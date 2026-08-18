import { api } from "@/lib/api";
import type { PaginatedResponse, ApiResponse } from "@/types/vendor.types";
import type {
  AdminListingListItem,
  AdminListingDetail,
  AdminListingStatus,
} from "@/types/listing-admin.types";

export async function getListingsApi(
  token: string,
  page: number,
  status?: string,
  search?: string,
  vendorId?: number,
): Promise<PaginatedResponse<AdminListingListItem>> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (vendorId) params.set("vendor_id", String(vendorId));
  return api.get(`/api/vehicles/admin/listings/?${params.toString()}`, {
    token,
  });
}

export async function getListingDetailApi(
  token: string,
  listingId: number,
): Promise<ApiResponse<AdminListingDetail>> {
  return api.get(`/api/vehicles/admin/listings/${listingId}/`, { token });
}

export async function updateListingStatusApi(
  token: string,
  listingId: number,
  newStatus: AdminListingStatus,
  reason: string,
): Promise<ApiResponse<AdminListingDetail>> {
  return api.patch(
    `/api/vehicles/admin/listings/${listingId}/status/`,
    { status: newStatus, reason },
    { token },
  );
}
