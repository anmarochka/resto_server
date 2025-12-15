export type AnalyticsEventName =
  | "reservation.created"
  | "reservation.cancelled"
  | "reservation.status_changed"
  | "reservation.updated"

export type ReservationAnalyticsEvent = {
  event: AnalyticsEventName
  reservationId: string
  restaurantId: string
  hallId: string
  tableId: string
  guests: number
  date: string // YYYY-MM-DD
  timeFrom: string // HH:MM
  timeTo: string // HH:MM
  timestamp: string // ISO
  status?: "pending" | "confirmed" | "cancelled" | "completed"
}