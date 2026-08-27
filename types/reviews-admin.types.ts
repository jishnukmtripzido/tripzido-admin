export interface AdminReviewListItem {
  id: number;
  booking_id: number;
  customer_name: string;
  vehicle_name: string;
  vendor_name: string;
  review_text: string;
  average_rating: number | null;
  moderation_status: "PENDING" | "APPROVED" | "REMOVED" | "FLAGGED";
  moderation_status_label: string;
  created_at: string;
}

export interface AdminReviewRating {
  criterion: string;
  criterion_label: string;
  score: number;
}

export interface AdminReviewDetail {
  id: number;
  booking_id: number;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  vehicle_name: string;
  vendor_name: string;
  review_text: string;
  average_rating: number | null;
  ratings: AdminReviewRating[];
  moderation_status: "PENDING" | "APPROVED" | "REMOVED" | "FLAGGED";
  moderation_status_label: string;
  moderation_note: string;
  moderated_by_name: string | null;
  moderated_at: string | null;
  created_at: string;
}
