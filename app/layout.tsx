import type { Metadata } from "next";
import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const metadata: Metadata = {
  title: "Tripzido Admin",
  description: "Platform administration portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}
