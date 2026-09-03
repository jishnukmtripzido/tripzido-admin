// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAdminAuth } from "@/context/AdminAuthContext";
// import { Sidebar } from "@/components/layout/Sidebar";
// import { PageLoader } from "@/components/ui/PageLoader";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { isAuthenticated, isHydrated } = useAdminAuth();
//   const router = useRouter();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   useEffect(() => {
//     // Wait for hydration before deciding to redirect — otherwise a
//     // genuinely logged-in staffer gets bounced to /login for a split
//     // second while their stored session is still being read.
//     if (isHydrated && !isAuthenticated) router.replace("/login");
//   }, [isHydrated, isAuthenticated, router]);

//   if (!isHydrated || !isAuthenticated) return <PageLoader fullScreen />;

//   return (
//     <div className="flex h-dvh bg-gray-50">
//       <Sidebar
//         mobileOpen={mobileOpen}
//         onCloseMobile={() => setMobileOpen(false)}
//       />
//       <div className="flex-1 flex flex-col min-w-0">
//         <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
//           <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           </button>
//           <h1 className="font-heading font-bold">tripzido admin</h1>
//           <div className="w-6" />
//         </header>
//         <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PageLoader } from "@/components/ui/PageLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated } = useAdminAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace("/login");
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || !isAuthenticated) return <PageLoader fullScreen />;

  return (
    <div className="flex h-dvh bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
