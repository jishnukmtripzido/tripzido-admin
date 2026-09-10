"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getAdminBookingDetailApi,
  adminCancelBookingApi,
} from "@/services/bookings-admin.service";
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

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Compact "4pm" / "5:30am" style, no leading zero on the hour, minutes
// only shown when non-zero.
function formatCompactTime(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? "pm" : "am";
  let hour = hour24 % 12;
  if (hour === 0) hour = 12;
  return minute === 0
    ? `${hour}${period}`
    : `${hour}:${String(minute).padStart(2, "0")}${period}`;
}

function formatDayMonthYear(day: number, month: number, year: number): string {
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

// pickup_date/dropoff_date + pickup_time/dropoff_time arrive as
// separate raw strings ("2026-09-10", "17:00:00") with no timezone
// info at all — these are plain wall-clock digits, not an instant.
// Parsing them by splitting the string directly, never through
// `new Date()`, sidesteps every naive/aware ambiguity entirely —
// there's nothing to convert, just digits to reformat.
function formatDateTimeStrings(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return `${formatDayMonthYear(day, month, year)}, ${formatCompactTime(hour, minute)}`;
}

// created_at/cancelled_at/handed_over_at/returned_at DO arrive as
// proper aware ISO strings (e.g. "...+05:30"). Extracting the
// IST-specific components explicitly via Intl.DateTimeFormat, rather
// than new Date(iso).getHours() (which reads the BROWSER's own
// ambient timezone), keeps this correct regardless of what machine
// renders it — same reasoning as the dateUtils.ts fix earlier.
function formatISODateTime(iso: string): string {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return `${formatDayMonthYear(day, month, year)}, ${formatCompactTime(hour, minute)}`;
}

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
            value={formatDateTimeStrings(
              booking.pickup_date,
              booking.pickup_time,
            )}
          />
          <Field
            label="Dropoff"
            value={formatDateTimeStrings(
              booking.dropoff_date,
              booking.dropoff_time,
            )}
          />
          <Field label="Location" value={booking.pickup_location_name} />
          <Field
            label="Payment mode"
            value={`${booking.payment_mode_label}${booking.is_offline ? " (Offline)" : ""}`}
          />
          <Field
            label="Created"
            value={formatISODateTime(booking.created_at)}
          />
          <Field label="Created by" value={booking.created_by_name || "—"} />
        </div>
      </div>

      {booking.status === "CONFIRMED" && (
        <AdminCancelAction
          bookingId={booking.id}
          token={token!}
          onCancelled={load}
        />
      )}

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
              ? formatISODateTime(booking.handed_over_at)
              : "—"
          }
        />
        <Row
          label="Returned"
          value={
            booking.returned_at ? formatISODateTime(booking.returned_at) : "—"
          }
        />
      </Section>

      {(booking.cancelled_at || booking.cancellation) && (
        <Section title="Cancellation">
          <Row
            label="Cancelled at"
            value={
              booking.cancelled_at
                ? formatISODateTime(booking.cancelled_at)
                : "—"
            }
          />
          <Row
            label="Cancelled by"
            value={
              booking.cancellation?.cancelled_by_name
                ? `${booking.cancellation.cancelled_by_name} (${booking.cancelled_by_role})`
                : booking.cancelled_by_role || "—"
            }
          />
          {booking.cancellation ? (
            <>
              <Row label="Reason" value={booking.cancellation.reason_code} />
              {booking.cancellation.reason_text && (
                <Row label="Details" value={booking.cancellation.reason_text} />
              )}
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
            </>
          ) : (
            <p className="text-xs text-font-dim italic mt-2">
              No detailed cancellation record found — reason and refund
              breakdown unavailable for this booking.
            </p>
          )}
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
              {/* <p className="font-bold text-brand-secondary">₹{p.amount}</p> */}
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

function AdminCancelAction({
  bookingId,
  token,
  onCancelled,
}: {
  bookingId: number;
  token: string;
  onCancelled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [refundOverride, setRefundOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!reasonText.trim()) {
      setError("A reason is required.");
      return;
    }
    const overrideNum = refundOverride.trim()
      ? Number(refundOverride)
      : undefined;
    if (overrideNum !== undefined && (overrideNum < 0 || overrideNum > 100)) {
      setError("Refund override must be between 0 and 100.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminCancelBookingApi(
        token,
        bookingId,
        reasonText,
        overrideNum,
      );
      if (!res.success) {
        setError(res.message || "Failed to cancel booking");
        return;
      }
      setOpen(false);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setReasonText("");
          setRefundOverride("");
          setError(null);
        }}
        className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2.5 rounded-xl w-full sm:w-auto"
      >
        Cancel booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => !submitting && setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-3">
            <h3 className="font-heading font-bold text-base">
              Cancel this booking?
            </h3>
            <p className="text-xs text-font-dim">
              Defaults to a 100% refund of whatever&rsquo;s been collected,
              unless you override it below.
            </p>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={3}
              placeholder="Reason for cancellation (required)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Refund override % (optional, 0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={refundOverride}
                onChange={(e) => setRefundOverride(e.target.value)}
                placeholder="Leave blank for 100%"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-red-500 disabled:opacity-50"
              >
                {submitting ? "Cancelling..." : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
