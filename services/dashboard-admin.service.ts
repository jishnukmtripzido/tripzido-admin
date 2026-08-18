import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/vendor.types";
import type { AdminDashboardData } from "@/types/dashboard-admin.types";

export async function getAdminDashboardApi(
  token: string,
): Promise<ApiResponse<AdminDashboardData>> {
  return api.get(`/api/administrations/admin/dashboard/`, { token });
}
