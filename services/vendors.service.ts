import { api } from "@/lib/api";
import type {
  VendorListItem,
  VendorDetail,
  VendorDocument,
  VendorBankAccount,
  VendorCommission,
  SubscriptionPlan,
  VendorSubscriptionRecord,
  PaginatedResponse,
  ApiResponse,
} from "@/types/vendor.types";

export async function getVendorsApi(
  token: string,
  page: number,
  status?: string,
  search?: string,
): Promise<PaginatedResponse<VendorListItem>> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return api.get(`/api/vendors/admin/vendors/?${params.toString()}`, { token });
}

export async function getVendorDetailApi(
  token: string,
  vendorId: number,
): Promise<ApiResponse<VendorDetail>> {
  return api.get(`/api/vendors/admin/vendors/${vendorId}/`, { token });
}

export async function updateVendorStatusApi(
  token: string,
  vendorId: number,
  newStatus: string,
  reason: string,
): Promise<ApiResponse<VendorDetail>> {
  return api.patch(
    `/api/vendors/admin/vendors/${vendorId}/status/`,
    { status: newStatus, reason },
    { token },
  );
}

export async function getVendorDocumentsApi(
  token: string,
  vendorId: number,
): Promise<ApiResponse<VendorDocument[]>> {
  return api.get(`/api/vendors/admin/vendors/${vendorId}/documents/`, {
    token,
  });
}

export async function reviewDocumentApi(
  token: string,
  docId: number,
  newStatus: "VERIFIED" | "REJECTED",
  rejectionReason: string,
): Promise<ApiResponse<VendorDocument>> {
  return api.patch(
    `/api/vendors/admin/documents/${docId}/review/`,
    { status: newStatus, rejection_reason: rejectionReason },
    { token },
  );
}

export async function getVendorBankAccountsApi(
  token: string,
  vendorId: number,
): Promise<ApiResponse<VendorBankAccount[]>> {
  return api.get(`/api/vendors/admin/vendors/${vendorId}/bank-accounts/`, {
    token,
  });
}

export async function reviewBankAccountApi(
  token: string,
  accountId: number,
  newStatus: "VERIFIED" | "REJECTED",
  rejectionReason: string,
): Promise<ApiResponse<VendorBankAccount>> {
  return api.patch(
    `/api/vendors/admin/bank-accounts/${accountId}/review/`,
    { status: newStatus, rejection_reason: rejectionReason },
    { token },
  );
}

export async function getCommissionsApi(
  token: string,
): Promise<ApiResponse<VendorCommission[]>> {
  return api.get(`/api/vendors/admin/commissions/`, { token });
}
export async function createCommissionApi(
  token: string,
  data: Partial<VendorCommission>,
): Promise<ApiResponse<VendorCommission>> {
  return api.post(`/api/vendors/admin/commissions/`, data, { token });
}
export async function updateCommissionApi(
  token: string,
  id: number,
  data: Partial<VendorCommission>,
): Promise<ApiResponse<VendorCommission>> {
  return api.patch(`/api/vendors/admin/commissions/${id}/`, data, { token });
}
export async function deleteCommissionApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vendors/admin/commissions/${id}/`, { token });
}

// Subscription plan CRUD functions land with the deferred page next message.

export async function getSubscriptionPlansApi(
  token: string,
): Promise<ApiResponse<SubscriptionPlan[]>> {
  return api.get(`/api/vendors/admin/subscription-plans/`, { token });
}

export async function getVendorSubscriptionsApi(
  token: string,
  vendorId: number,
): Promise<ApiResponse<VendorSubscriptionRecord[]>> {
  return api.get(`/api/vendors/admin/vendors/${vendorId}/subscriptions/`, {
    token,
  });
}
export async function assignVendorSubscriptionApi(
  token: string,
  vendorId: number,
  planId: number,
): Promise<ApiResponse<VendorSubscriptionRecord>> {
  return api.post(
    `/api/vendors/admin/vendors/${vendorId}/subscriptions/assign/`,
    { plan_id: planId },
    { token },
  );
}

export async function createSubscriptionPlanApi(
  token: string,
  data: Partial<SubscriptionPlan>,
): Promise<ApiResponse<SubscriptionPlan>> {
  return api.post(`/api/vendors/admin/subscription-plans/`, data, { token });
}
export async function updateSubscriptionPlanApi(
  token: string,
  id: number,
  data: Partial<SubscriptionPlan>,
): Promise<ApiResponse<SubscriptionPlan>> {
  return api.patch(`/api/vendors/admin/subscription-plans/${id}/`, data, {
    token,
  });
}
export async function deleteSubscriptionPlanApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vendors/admin/subscription-plans/${id}/`, { token });
}
