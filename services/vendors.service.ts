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
  VendorTeamMember,
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

export async function updateVendorDetailsApi(
  token: string,
  vendorId: number,
  data: Partial<{
    business_name: string;
    owner_name: string;
    email: string;
    address: string;
    gst_number: string;
  }>,
): Promise<ApiResponse<VendorDetail>> {
  return api.patch(`/api/vendors/admin/vendors/${vendorId}/`, data, { token });
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

export async function uploadVendorDocumentApi(
  token: string,
  vendorId: number,
  docType: string,
  file: File,
): Promise<ApiResponse<VendorDocument>> {
  const formData = new FormData();
  formData.append("doc_type", docType);
  formData.append("file", file);
  return api.post(
    `/api/vendors/admin/vendors/${vendorId}/documents/`,
    formData,
    {
      token,
    },
  );
}

export async function updateVendorDocumentApi(
  token: string,
  docId: number,
  data: { doc_type?: string; file?: File },
): Promise<ApiResponse<VendorDocument>> {
  const formData = new FormData();
  if (data.doc_type) formData.append("doc_type", data.doc_type);
  if (data.file) formData.append("file", data.file);
  return api.patch(`/api/vendors/admin/documents/${docId}/`, formData, {
    token,
  });
}

export async function deactivateVendorDocumentApi(
  token: string,
  docId: number,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/vendors/admin/documents/${docId}/deactivate/`,
    {},
    { token },
  );
}

export async function restoreVendorDocumentApi(
  token: string,
  docId: number,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/vendors/admin/documents/${docId}/restore/`,
    {},
    { token },
  );
}

export async function deleteVendorDocumentApi(
  token: string,
  docId: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vendors/admin/documents/${docId}/`, { token });
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

export async function createVendorBankAccountApi(
  token: string,
  vendorId: number,
  data: {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name?: string;
    branch_name?: string;
  },
): Promise<ApiResponse<VendorBankAccount>> {
  return api.post(
    `/api/vendors/admin/vendors/${vendorId}/bank-accounts/`,
    data,
    {
      token,
    },
  );
}

export async function updateVendorBankAccountApi(
  token: string,
  accountId: number,
  data: Partial<{
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name: string;
  }>,
): Promise<ApiResponse<VendorBankAccount>> {
  return api.patch(`/api/vendors/admin/bank-accounts/${accountId}/`, data, {
    token,
  });
}

export async function deactivateVendorBankAccountApi(
  token: string,
  accountId: number,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/vendors/admin/bank-accounts/${accountId}/deactivate/`,
    {},
    { token },
  );
}

export async function restoreVendorBankAccountApi(
  token: string,
  accountId: number,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/vendors/admin/bank-accounts/${accountId}/restore/`,
    {},
    { token },
  );
}

export async function deleteVendorBankAccountApi(
  token: string,
  accountId: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vendors/admin/bank-accounts/${accountId}/`, {
    token,
  });
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

export async function registerVendorApi(
  token: string,
  data: {
    phone_number: string;
    phone_country_code: string;
    email: string;
    password: string;
    business_name: string;
    owner_name: string;
    address: string;
    gst_number: string;
    existing_user_id?: number;
  },
): Promise<ApiResponse<VendorDetail>> {
  return api.post(`/api/vendors/admin/register/`, data, { token });
}

export async function getVendorTeamApi(
  token: string,
  vendorId: number,
): Promise<ApiResponse<VendorTeamMember[]>> {
  return api.get(`/api/vendors/admin/vendors/${vendorId}/team/`, { token });
}
export async function addVendorTeamMemberApi(
  token: string,
  vendorId: number,
  data: {
    phone_number: string;
    phone_country_code: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  },
): Promise<ApiResponse<VendorTeamMember>> {
  return api.post(`/api/vendors/admin/vendors/${vendorId}/team/`, data, {
    token,
  });
}
export async function removeVendorTeamMemberApi(
  token: string,
  memberId: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vendors/admin/team/${memberId}/`, { token });
}

export async function deactivateVendorTeamMemberApi(
  token: string,
  memberId: number,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/vendors/admin/team/${memberId}/deactivate/`,
    {},
    { token },
  );
}
export async function restoreVendorTeamMemberApi(
  token: string,
  memberId: number,
): Promise<ApiResponse<null>> {
  return api.patch(
    `/api/vendors/admin/team/${memberId}/restore/`,
    {},
    { token },
  );
}
