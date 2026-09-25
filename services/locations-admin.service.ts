import { api } from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/vendor.types";
import type {
  CountryAdmin,
  StateAdmin,
  CityAdmin,
  PickupLocationAdmin,
} from "@/types/location-admin.types";

export async function getCountriesApi(
  token: string,
): Promise<ApiResponse<CountryAdmin[]>> {
  return api.get(`/api/locations/admin/countries/`, { token });
}
export async function createCountryApi(
  token: string,
  data: Partial<CountryAdmin>,
): Promise<ApiResponse<CountryAdmin>> {
  return api.post(`/api/locations/admin/countries/`, data, { token });
}
export async function updateCountryApi(
  token: string,
  id: number,
  data: Partial<CountryAdmin>,
): Promise<ApiResponse<CountryAdmin>> {
  return api.patch(`/api/locations/admin/countries/${id}/`, data, { token });
}
export async function deleteCountryApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/locations/admin/countries/${id}/`, { token });
}

export async function getStatesApi(
  token: string,
  countryId?: number,
): Promise<ApiResponse<StateAdmin[]>> {
  const params = countryId ? `?country_id=${countryId}` : "";
  return api.get(`/api/locations/admin/states/${params}`, { token });
}
export async function createStateApi(
  token: string,
  data: Partial<StateAdmin>,
): Promise<ApiResponse<StateAdmin>> {
  return api.post(`/api/locations/admin/states/`, data, { token });
}
export async function updateStateApi(
  token: string,
  id: number,
  data: Partial<StateAdmin>,
): Promise<ApiResponse<StateAdmin>> {
  return api.patch(`/api/locations/admin/states/${id}/`, data, { token });
}
export async function deleteStateApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/locations/admin/states/${id}/`, { token });
}

export async function getCitiesApi(
  token: string,
  page: number,
  stateId?: number,
  search?: string,
): Promise<PaginatedResponse<CityAdmin>> {
  const params = new URLSearchParams({ page: String(page) });
  if (stateId) params.set("state_id", String(stateId));
  if (search) params.set("search", search);
  return api.get(`/api/locations/admin/cities/?${params.toString()}`, {
    token,
  });
}

// Multipart — city_image is a real file upload, same pattern as
// createVehicleTypeApi in the catalog module.
async function submitCityForm(
  token: string,
  method: "POST" | "PATCH",
  url: string,
  fields: Record<string, string | number | File | null>,
): Promise<ApiResponse<CityAdmin>> {
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
export async function createCityApi(
  token: string,
  fields: Record<string, string | number | File | null>,
): Promise<ApiResponse<CityAdmin>> {
  return submitCityForm(token, "POST", `/api/locations/admin/cities/`, fields);
}
export async function updateCityApi(
  token: string,
  id: number,
  fields: Record<string, string | number | File | null>,
): Promise<ApiResponse<CityAdmin>> {
  return submitCityForm(
    token,
    "PATCH",
    `/api/locations/admin/cities/${id}/`,
    fields,
  );
}
export async function deleteCityApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/locations/admin/cities/${id}/`, { token });
}

export async function getPickupLocationsAdminApi(
  token: string,
  page: number,
  cityId?: number,
  search?: string,
): Promise<PaginatedResponse<PickupLocationAdmin>> {
  const params = new URLSearchParams({ page: String(page) });
  if (cityId) params.set("city_id", String(cityId));
  if (search) params.set("search", search);
  return api.get(
    `/api/locations/admin/pickup-locations/?${params.toString()}`,
    { token },
  );
}
export async function createPickupLocationApi(
  token: string,
  data: Partial<PickupLocationAdmin>,
): Promise<ApiResponse<PickupLocationAdmin>> {
  return api.post(`/api/locations/admin/pickup-locations/`, data, { token });
}
export async function updatePickupLocationApi(
  token: string,
  id: number,
  data: Partial<PickupLocationAdmin>,
): Promise<ApiResponse<PickupLocationAdmin>> {
  return api.patch(`/api/locations/admin/pickup-locations/${id}/`, data, {
    token,
  });
}
export async function deletePickupLocationApi(
  token: string,
  id: number,
): Promise<ApiResponse<null>> {
  return api.delete(`/api/locations/admin/pickup-locations/${id}/`, { token });
}
