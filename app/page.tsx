"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PageLoader } from "@/components/ui/PageLoader";

export default function RootPage() {
  const { isAuthenticated, isHydrated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isHydrated, isAuthenticated, router]);

  return <PageLoader fullScreen />;
}
