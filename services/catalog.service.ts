import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/vendor.types";
import type { Brand } from "@/types/listing-admin.types";

export async function getBrandsAdminApi(
  token: string,
): Promise<ApiResponse<Brand[]>> {
  return api.get(`/api/vehicles/admin/brands/`, { token });
}
export async function createBrandApi(
  token: string,
  name: string,
): Promise<ApiResponse<Brand>> {
  return api.post(`/api/vehicles/admin/brands/`, { name }, { token });
}
export async function updateBrandApi(
  token: string,
  id: number,
  name: string,
): Promise<ApiResponse<Brand>> {
  return api.patch(`/api/vehicles/admin/brands/${id}/`, { name }, { token });
}
export async function deleteBrandApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vehicles/admin/brands/${id}/`, { token });
}

import type { PaginatedResponse } from "@/types/vendor.types";
import type {
  VehicleTypeAdmin,
  PackageCategory,
  PricingPackageTypeAdmin,
} from "@/types/listing-admin.types";

export async function getVehicleTypesAdminApi(
  token: string,
  page: number,
  search?: string,
  brandId?: number,
): Promise<PaginatedResponse<VehicleTypeAdmin>> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  if (brandId) params.set("brand_id", String(brandId));
  return api.get(`/api/vehicles/admin/vehicle-types/?${params.toString()}`, {
    token,
  });
}

// Multipart — bypasses lib/api.ts's JSON-only wrapper, since
// primary_image is a real file upload, same pattern as
// uploadListingImagesApi in the vendor portal.
async function submitVehicleTypeForm(
  token: string,
  method: "POST" | "PATCH",
  url: string,
  fields: Record<string, string | boolean | number | File | null>,
): Promise<ApiResponse<VehicleTypeAdmin>> {
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

export async function createVehicleTypeApi(
  token: string,
  fields: Record<string, string | boolean | number | File | null>,
): Promise<ApiResponse<VehicleTypeAdmin>> {
  return submitVehicleTypeForm(
    token,
    "POST",
    `/api/vehicles/admin/vehicle-types/`,
    fields,
  );
}
export async function updateVehicleTypeApi(
  token: string,
  id: number,
  fields: Record<string, string | boolean | number | File | null>,
): Promise<ApiResponse<VehicleTypeAdmin>> {
  return submitVehicleTypeForm(
    token,
    "PATCH",
    `/api/vehicles/admin/vehicle-types/${id}/`,
    fields,
  );
}
export async function deleteVehicleTypeApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vehicles/admin/vehicle-types/${id}/`, { token });
}

export async function getPackageCategoriesApi(
  token: string,
): Promise<ApiResponse<PackageCategory[]>> {
  return api.get(`/api/vehicles/admin/package-categories/`, { token });
}
export async function createPackageCategoryApi(
  token: string,
  data: Partial<PackageCategory>,
): Promise<ApiResponse<PackageCategory>> {
  return api.post(`/api/vehicles/admin/package-categories/`, data, { token });
}
export async function updatePackageCategoryApi(
  token: string,
  id: number,
  data: Partial<PackageCategory>,
): Promise<ApiResponse<PackageCategory>> {
  return api.patch(`/api/vehicles/admin/package-categories/${id}/`, data, {
    token,
  });
}
export async function deletePackageCategoryApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vehicles/admin/package-categories/${id}/`, { token });
}

export async function getPackageTypesAdminApi(
  token: string,
): Promise<ApiResponse<PricingPackageTypeAdmin[]>> {
  return api.get(`/api/vehicles/admin/package-types/`, { token });
}
export async function createPackageTypeApi(
  token: string,
  data: Partial<PricingPackageTypeAdmin>,
): Promise<ApiResponse<PricingPackageTypeAdmin>> {
  return api.post(`/api/vehicles/admin/package-types/`, data, { token });
}
export async function updatePackageTypeApi(
  token: string,
  id: number,
  data: Partial<PricingPackageTypeAdmin>,
): Promise<ApiResponse<PricingPackageTypeAdmin>> {
  return api.patch(`/api/vehicles/admin/package-types/${id}/`, data, { token });
}
export async function deletePackageTypeApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/vehicles/admin/package-types/${id}/`, { token });
}
