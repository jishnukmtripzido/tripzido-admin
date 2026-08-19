import { api } from "@/lib/api";
import type { PaginatedResponse, ApiResponse } from "@/types/vendor.types";
import type { RefundRecord } from "@/types/refunds-admin.types";

export async function getRefundsApi(
  token: string,
  page: number,
  statusFilter?: string,
  search?: string,
): Promise<PaginatedResponse<RefundRecord>> {
  const params = new URLSearchParams({ page: String(page) });
  if (statusFilter) params.set("status", statusFilter);
  if (search) params.set("search", search);
  return api.get(`/api/payments/admin/refunds/?${params.toString()}`, {
    token,
  });
}

export async function updateRefundStatusApi(
  token: string,
  id: number,
  data: { status: string; reference_number?: string; note?: string },
): Promise<ApiResponse<RefundRecord>> {
  return api.patch(`/api/payments/admin/refunds/${id}/status/`, data, {
    token,
  });
}
