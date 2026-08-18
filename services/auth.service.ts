import { api } from "@/lib/api";
import type { StaffLoginResponse } from "@/types/auth.types";

export async function staffLoginApi(
  email: string,
  password: string,
): Promise<StaffLoginResponse> {
  return api.post<StaffLoginResponse>("/api/users/staff/login/", {
    email,
    password,
  });
}
