import { api } from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/vendor.types";
import type {
  TaxRateAdmin,
  PlatformConfigAdmin,
  OfferAdmin,
  PopularRentalAdmin,
  AnnouncementBannerAdmin,
  CancellationPolicyListItem,
  CancellationPolicyDetail,
  CancellationTierAdmin,
  LegalDocumentAdmin,
} from "@/types/content-admin.types";

export async function getTaxRatesApi(
  token: string,
  page: number,
  context?: string,
): Promise<PaginatedResponse<TaxRateAdmin>> {
  const params = new URLSearchParams({ page: String(page) });
  if (context) params.set("context", context);
  return api.get(`/api/administrations/admin/tax-rates/?${params.toString()}`, {
    token,
  });
}
export async function createTaxRateApi(
  token: string,
  data: Partial<TaxRateAdmin>,
): Promise<ApiResponse<TaxRateAdmin>> {
  return api.post(`/api/administrations/admin/tax-rates/`, data, { token });
}

export async function getPlatformConfigApi(
  token: string,
): Promise<ApiResponse<PlatformConfigAdmin[]>> {
  return api.get(`/api/administrations/admin/platform-config/`, { token });
}
export async function createPlatformConfigApi(
  token: string,
  data: Partial<PlatformConfigAdmin>,
): Promise<ApiResponse<PlatformConfigAdmin>> {
  return api.post(`/api/administrations/admin/platform-config/`, data, {
    token,
  });
}
export async function updatePlatformConfigApi(
  token: string,
  id: number,
  data: Partial<PlatformConfigAdmin>,
): Promise<ApiResponse<PlatformConfigAdmin>> {
  return api.patch(`/api/administrations/admin/platform-config/${id}/`, data, {
    token,
  });
}
export async function deletePlatformConfigApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/administrations/admin/platform-config/${id}/`, {
    token,
  });
}

export async function getOffersApi(
  token: string,
): Promise<ApiResponse<OfferAdmin[]>> {
  return api.get(`/api/administrations/admin/offers/`, { token });
}
export async function createOfferApi(
  token: string,
  data: Partial<OfferAdmin>,
): Promise<ApiResponse<OfferAdmin>> {
  return api.post(`/api/administrations/admin/offers/`, data, { token });
}
export async function updateOfferApi(
  token: string,
  id: number,
  data: Partial<OfferAdmin>,
): Promise<ApiResponse<OfferAdmin>> {
  return api.patch(`/api/administrations/admin/offers/${id}/`, data, { token });
}
export async function deleteOfferApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/administrations/admin/offers/${id}/`, { token });
}

export async function getPopularRentalsApi(
  token: string,
  cityId?: number,
): Promise<ApiResponse<PopularRentalAdmin[]>> {
  const params = cityId ? `?city_id=${cityId}` : "";
  return api.get(`/api/administrations/admin/popular-rentals/${params}`, {
    token,
  });
}
async function submitPopularRentalForm(
  token: string,
  method: "POST" | "PATCH",
  url: string,
  fields: Record<string, string | number | File | null>,
): Promise<ApiResponse<PopularRentalAdmin>> {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    formData.append(key, value instanceof File ? value : String(value));
  });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}
export async function createPopularRentalApi(
  token: string,
  fields: Record<string, string | number | File | null>,
): Promise<ApiResponse<PopularRentalAdmin>> {
  return submitPopularRentalForm(
    token,
    "POST",
    `/api/administrations/admin/popular-rentals/`,
    fields,
  );
}
export async function updatePopularRentalApi(
  token: string,
  id: number,
  fields: Record<string, string | number | File | null>,
): Promise<ApiResponse<PopularRentalAdmin>> {
  return submitPopularRentalForm(
    token,
    "PATCH",
    `/api/administrations/admin/popular-rentals/${id}/`,
    fields,
  );
}
export async function deletePopularRentalApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/administrations/admin/popular-rentals/${id}/`, {
    token,
  });
}

export async function getBannersApi(
  token: string,
  page?: string,
): Promise<ApiResponse<AnnouncementBannerAdmin[]>> {
  const params = page ? `?page=${page}` : "";
  return api.get(`/api/administrations/admin/banners/${params}`, { token });
}
export async function createBannerApi(
  token: string,
  data: Partial<AnnouncementBannerAdmin>,
): Promise<ApiResponse<AnnouncementBannerAdmin>> {
  return api.post(`/api/administrations/admin/banners/`, data, { token });
}
export async function updateBannerApi(
  token: string,
  id: number,
  data: Partial<AnnouncementBannerAdmin>,
): Promise<ApiResponse<AnnouncementBannerAdmin>> {
  return api.patch(`/api/administrations/admin/banners/${id}/`, data, {
    token,
  });
}
export async function deleteBannerApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/administrations/admin/banners/${id}/`, { token });
}

export async function getCancellationPoliciesApi(
  token: string,
  page: number,
): Promise<PaginatedResponse<CancellationPolicyListItem>> {
  return api.get(
    `/api/administrations/admin/cancellation-policies/?page=${page}`,
    { token },
  );
}
export async function getCancellationPolicyDetailApi(
  token: string,
  id: number,
): Promise<ApiResponse<CancellationPolicyDetail>> {
  return api.get(`/api/administrations/admin/cancellation-policies/${id}/`, {
    token,
  });
}
export async function createCancellationPolicyApi(
  token: string,
  data: {
    name: string;
    refund_note: string;
    is_current: boolean;
    tiers: CancellationTierAdmin[];
  },
): Promise<ApiResponse<CancellationPolicyDetail>> {
  return api.post(`/api/administrations/admin/cancellation-policies/`, data, {
    token,
  });
}

export async function getLegalDocumentsApi(
  token: string,
  page: number,
  docType?: string,
): Promise<PaginatedResponse<LegalDocumentAdmin>> {
  const params = new URLSearchParams({ page: String(page) });
  if (docType) params.set("doc_type", docType);
  return api.get(
    `/api/administrations/admin/legal-documents/?${params.toString()}`,
    { token },
  );
}
export async function createLegalDocumentApi(
  token: string,
  data: { doc_type: string; content: string; is_current: boolean },
): Promise<ApiResponse<LegalDocumentAdmin>> {
  return api.post(`/api/administrations/admin/legal-documents/`, data, {
    token,
  });
}
