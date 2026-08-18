import { api } from "@/lib/api";
import type { PaginatedResponse, ApiResponse } from "@/types/vendor.types";
import type { AdminPayment } from "@/types/payments-admin.types";

export async function getAdminPaymentsApi(
  token: string,
  page: number,
  statusFilter?: string,
  search?: string,
  isReconciled?: boolean,
): Promise<PaginatedResponse<AdminPayment>> {
  const params = new URLSearchParams({ page: String(page) });
  if (statusFilter) params.set("status", statusFilter);
  if (search) params.set("search", search);
  if (isReconciled !== undefined)
    params.set("is_reconciled", String(isReconciled));
  return api.get(`/api/payments/admin/payments/?${params.toString()}`, {
    token,
  });
}
export async function toggleReconciledApi(
  token: string,
  id: number,
): Promise<ApiResponse<AdminPayment>> {
  return api.patch(
    `/api/payments/admin/payments/${id}/toggle-reconciled/`,
    {},
    { token },
  );
}

import type {
  EligibleBooking,
  VendorPayoutListItem,
  VendorPayoutDetail,
} from "@/types/payments-admin.types";

export async function getEligibleBookingsApi(
  token: string,
  page: number,
  vendorId?: number,
  search?: string,
): Promise<PaginatedResponse<EligibleBooking>> {
  const params = new URLSearchParams({ page: String(page) });
  if (vendorId) params.set("vendor_id", String(vendorId));
  if (search) params.set("search", search);
  return api.get(
    `/api/payments/admin/eligible-bookings/?${params.toString()}`,
    { token },
  );
}

export async function getPayoutsApi(
  token: string,
  page: number,
  vendorId?: number,
  statusFilter?: string,
): Promise<PaginatedResponse<VendorPayoutListItem>> {
  const params = new URLSearchParams({ page: String(page) });
  if (vendorId) params.set("vendor_id", String(vendorId));
  if (statusFilter) params.set("status", statusFilter);
  return api.get(`/api/payments/admin/payouts/?${params.toString()}`, {
    token,
  });
}

export async function getPayoutDetailApi(
  token: string,
  id: number,
): Promise<ApiResponse<VendorPayoutDetail>> {
  return api.get(`/api/payments/admin/payouts/${id}/`, { token });
}

export async function createPayoutApi(
  token: string,
  data: {
    vendor_id: number;
    booking_ids: number[];
    period_start?: string | null;
    period_end?: string | null;
    note?: string;
  },
): Promise<ApiResponse<VendorPayoutDetail>> {
  return api.post(`/api/payments/admin/payouts/`, data, { token });
}

export async function updatePayoutStatusApi(
  token: string,
  id: number,
  data: { status: string; utr_number?: string; note?: string },
): Promise<ApiResponse<VendorPayoutDetail>> {
  return api.patch(`/api/payments/admin/payouts/${id}/status/`, data, {
    token,
  });
}
