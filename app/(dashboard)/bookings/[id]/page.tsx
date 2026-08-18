"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getAdminBookingDetailApi } from "@/services/bookings-admin.service";
import type { AdminBookingDetail } from "@/types/bookings-admin.types";
import { PageLoader } from "@/components/ui/PageLoader";

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
};

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAdminAuth();
  const bookingId = Number(params.id);

  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminBookingDetailApi(token, bookingId);
      if (!res.success || !res.data) {
        setError(res.message || "Booking not found");
        return;
      }
      setBooking(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader />;
  if (error || !booking)
    return (
      <p className="text-sm text-red-500 text-center py-10">
        {error || "Booking not found"}
      </p>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => router.push("/bookings")}
        className="text-sm font-semibold text-font-dim"
      >
        ← Back to bookings
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-heading font-bold text-lg">
              {booking.vehicle_name}
            </h1>
            <p className="text-sm text-font-dim mt-1">
              #{booking.booking_reference}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[booking.status] ?? "bg-gray-100"}`}
          >
            {booking.status_label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <Field label="Vendor" value={booking.vendor_name} />
          <Field
            label="Customer"
            value={`${booking.customer_name} (${booking.customer_phone})`}
          />
          <Field
            label="Pickup"
            value={`${booking.pickup_date} ${booking.pickup_time}`}
          />
          <Field
            label="Dropoff"
            value={`${booking.dropoff_date} ${booking.dropoff_time}`}
          />
          <Field label="Location" value={booking.pickup_location_name} />
          <Field
            label="Payment mode"
            value={`${booking.payment_mode_label}${booking.is_offline ? " (Offline)" : ""}`}
          />
        </div>
      </div>

      <Section title="Pricing breakdown">
        <Row label="Listing amount" value={`₹${booking.listing_amount}`} />
        <Row label="Commission" value={`₹${booking.commission_amount}`} />
        <Row
          label="Net commission"
          value={`₹${booking.net_commission_amount}`}
        />
        <Row label="Net to vendor" value={`₹${booking.net_amount}`} bold />
        <Row label="Advance paid" value={`₹${booking.advance_amount}`} />
        <Row label="Remaining" value={`₹${booking.remaining_amount}`} />
        <Row
          label="Security deposit"
          value={`₹${booking.security_deposit_amount}`}
        />
        <Row
          label="Vendor tax"
          value={`${booking.vendor_tax_percentage}% • ₹${booking.vendor_tax_amount}`}
        />
        <Row
          label="Commission tax"
          value={`${booking.commission_tax_percentage}% • ₹${booking.commission_tax_amount}`}
        />
      </Section>

      <Section title="Operations">
        <Row
          label="Handed over"
          value={
            booking.handed_over_at
              ? new Date(booking.handed_over_at).toLocaleString()
              : "—"
          }
        />
        <Row
          label="Returned"
          value={
            booking.returned_at
              ? new Date(booking.returned_at).toLocaleString()
              : "—"
          }
        />
      </Section>

      {booking.cancellation && (
        <Section title="Cancellation">
          <Row label="Reason" value={booking.cancellation.reason_code} />
          {booking.cancellation.reason_text && (
            <Row label="Details" value={booking.cancellation.reason_text} />
          )}
          <Row
            label="Cancelled by"
            value={booking.cancellation.cancelled_by_role}
          />
          <Row
            label="Refund %"
            value={`${booking.cancellation.refund_percentage}%`}
          />
          <Row
            label="Refundable"
            value={`₹${booking.cancellation.refundable_amount}`}
          />
          <Row
            label="Forfeited"
            value={`₹${booking.cancellation.forfeited_amount}`}
          />
        </Section>
      )}

      <Section title={`Payments (${booking.payments.length})`}>
        <div className="space-y-2">
          {booking.payments.map((p) => (
            <div
              key={p.id}
              className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
            >
              <div>
                <p className="font-medium">
                  {p.payment_type} • {p.status}
                </p>
                <p className="text-xs text-font-dim">{p.gateway_order_id}</p>
              </div>
              <p className="font-bold text-brand-secondary">₹{p.amount}</p>
            </div>
          ))}
          {booking.payments.length === 0 && (
            <p className="text-sm text-font-dim">No payments recorded.</p>
          )}
        </div>
      </Section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-font-dim">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-heading font-bold text-sm mb-3">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-font-dim">{label}</span>
      <span className={bold ? "font-bold text-brand-secondary" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
