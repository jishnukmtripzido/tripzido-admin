"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

const NAV_SECTIONS = [
  {
    label: "Overview",
    links: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "Vendors",
    links: [
      { href: "/vendors", label: "All Vendors" },
      { href: "/vendors/approvals", label: "Approvals" },
      { href: "/vendors/commissions", label: "Commission Structures" },
      { href: "/vendors/subscription-plans", label: "Subscription Plans" },
      { href: "/vendors/new", label: "Register Vendor" },
    ],
  },
  {
    label: "Listings",
    links: [
      { href: "/listings", label: "All Listings" },
      { href: "/listings/approvals", label: "Approvals" },
    ],
  },
  {
    label: "Catalog",
    links: [
      { href: "/catalog/vehicle-types", label: "Vehicle Types" },
      { href: "/catalog/brands", label: "Brands" },
      { href: "/catalog/package-types", label: "Package Types" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/content/cancellation-policy", label: "Cancellation Policy" },
      { href: "/content/offers", label: "Offers" },
      { href: "/content/popular-rentals", label: "Popular Rentals" },
      { href: "/content/banners", label: "Banners" },
      { href: "/content/legal-documents", label: "Legal Documents" },
      { href: "/content/platform-config", label: "Platform Config" },
      { href: "/content/tax-rates", label: "Tax Rates" },
    ],
  },
  {
    label: "Locations",
    links: [
      { href: "/locations/countries", label: "Countries" },
      { href: "/locations/states", label: "States" },
      { href: "/locations/cities", label: "Cities" },
      { href: "/locations/pickup-locations", label: "Pickup Locations" },
    ],
  },
  {
    label: "Operations",
    links: [
      { href: "/bookings", label: "Bookings" },
      { href: "/payments", label: "Payments" },
      { href: "/payments/payouts", label: "Vendor Payouts" },
      { href: "/refunds", label: "Refunds" },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/staff", label: "Staff" },
      { href: "/customers", label: "Customers" },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-gray-100">
        <h1 className="font-heading font-extrabold text-xl">tripzido admin</h1>
        <p className="text-xs text-font-dim mt-1">
          {user?.first_name} {user?.last_name} • {user?.role}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-3 mb-1">
              {section.label}
            </p>
            {section.links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onCloseMobile}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    active
                      ? "bg-brand-yellow/20 text-brand-secondary font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always visible, part of layout flow */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-100 bg-white">
        {content}
      </aside>

      {/* Mobile — drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
