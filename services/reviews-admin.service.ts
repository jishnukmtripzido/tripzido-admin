import { api } from "@/lib/api";
import type { PaginatedResponse, ApiResponse } from "@/types/vendor.types";
import type {
  AdminReviewListItem,
  AdminReviewDetail,
} from "@/types/reviews-admin.types";

export async function getReviewsApi(
  token: string,
  page: number,
  statusFilter?: string,
  search?: string,
): Promise<PaginatedResponse<AdminReviewListItem>> {
  const params = new URLSearchParams({ page: String(page) });
  if (statusFilter) params.set("status", statusFilter);
  if (search) params.set("search", search);
  return api.get(`/api/vehicles/admin/reviews/?${params.toString()}`, {
    token,
  });
}

export async function updateReviewStatusApi(
  token: string,
  id: number,
  moderationStatus: string,
  moderationNote: string = "",
): Promise<ApiResponse<AdminReviewDetail>> {
  return api.patch(
    `/api/vehicles/admin/reviews/${id}/status/`,
    { moderation_status: moderationStatus, moderation_note: moderationNote },
    { token },
  );
}

export async function deleteReviewApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vehicles/admin/reviews/${id}/`, { token });
}
