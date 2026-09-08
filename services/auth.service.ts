// import { api } from "@/lib/api";
// import type { StaffLoginResponse, StaffRole } from "@/types/auth.types";

// export async function staffLoginApi(
//   email: string,
//   password: string,
// ): Promise<StaffLoginResponse> {
//   return api.post<StaffLoginResponse>("/api/users/staff/login/", {
//     email,
//     password,
//   });
// }

// interface StaffAuthResult {
//   email: string;
//   first_name: string;
//   last_name: string;
//   role: StaffRole;
//   access_token: string;
//   refresh_token: string;
// }

// export async function sendStaffForgotPasswordOtpApi(email: string) {
//   return api.post<{ success: boolean; message: string }>(
//     "/api/users/staff/forgot-password/send-otp/",
//     { email },
//   );
// }

// export async function resetStaffForgotPasswordApi(
//   email: string,
//   otp: string,
//   newPassword: string,
// ): Promise<{ success: boolean; message?: string; data?: StaffAuthResult }> {
//   return api.post("/api/users/staff/forgot-password/reset/", {
//     email,
//     otp,
//     new_password: newPassword,
//   });
// }

import { api } from "@/lib/api";
import type {
  StaffLoginResponse,
  StaffRole,
  VerifyOtpResponse,
} from "@/types/auth.types";

export async function staffLoginApi(
  email: string,
  password: string,
): Promise<StaffLoginResponse> {
  return api.post<StaffLoginResponse>("/api/users/staff/login/", {
    email,
    password,
  });
}

interface StaffAuthResult {
  email: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
  access_token: string;
  refresh_token: string;
}

export async function sendStaffForgotPasswordOtpApi(
  email: string,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    "/api/users/staff/forgot-password/send-otp/",
    {
      email,
    },
  );
}

export async function resetStaffForgotPasswordApi(
  email: string,
  otp: string,
  newPassword: string,
): Promise<{
  success: boolean;
  message?: string;
  data?: StaffAuthResult;
}> {
  return api.post<{
    success: boolean;
    message?: string;
    data?: StaffAuthResult;
  }>("/api/users/staff/forgot-password/reset/", {
    email,
    otp,
    new_password: newPassword,
  });
}

export async function sendVendorOtpApi(
  phoneNumber: string,
  turnstileToken: string,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    "/api/users/vendor/send-otp/",
    {
      phone_number: phoneNumber,
      turnstile_token: turnstileToken,
    },
  );
}

export async function verifyVendorOtpApi(
  phoneNumber: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>("/api/users/vendor/verify-otp/", {
    phone_number: phoneNumber,
    otp,
  });
}
