import { Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { WsGateway } from "../ws/ws.gateway"
import { AnalyticsEventBus } from "./analytics.event-bus"
import { AnalyticsService } from "./analytics.service"
import type { ReservationAnalyticsEvent } from "./analytics.events"

function toHHMM(d: Date) {
  return d.toISOString().slice(11, 16)
}

@Injectable()
export class WsEventsBridge implements OnModuleInit {
  constructor(
    private readonly bus: AnalyticsEventBus,
    private readonly prisma: PrismaService,
    private readonly ws: WsGateway,
    private readonly analytics: AnalyticsService,
  ) {}

  onModuleInit() {
    this.bus.on((evt) => void this.handle(evt))
  }

  private async handle(evt: ReservationAnalyticsEvent) {
    if (evt.event === "reservation.created") {
      const r = await this.prisma.reservations.findUnique({ where: { id: evt.reservationId } })
      if (r) {
        this.ws.emitToRestaurant(evt.restaurantId, {
          type: "booking_created",
          data: {
            id: r.id,
            userId: r.user_id,
            restaurantId: r.restaurant_id,
            tableId: r.table_id,
            date: r.date.toISOString().slice(0, 10),
            time: toHHMM(r.time_from),
            guests: r.guests_count,
            status: r.status,
            userName: r.guest_name ?? null,
            userPhone: r.guest_phone ?? null,
            createdAt: r.created_at?.toISOString?.() ?? new Date().toISOString(),
          },
        })
      }
    }

    if (evt.event === "reservation.cancelled") {
      this.ws.emitToRestaurant(evt.restaurantId, {
        type: "booking_status_changed",
        data: {
          bookingId: evt.reservationId,
          oldStatus: evt.oldStatus ?? "pending",
          newStatus: "cancelled",
          restaurantId: evt.restaurantId,
        },
      })

      this.ws.emitToRestaurant(evt.restaurantId, {
        type: "booking_cancelled",
        data: {
          bookingId: evt.reservationId,
          restaurantId: evt.restaurantId,
          tableId: evt.tableId,
        },
      })
    }

    if (evt.event === "reservation.status_changed") {
      const newStatus = evt.newStatus ?? evt.status
      const oldStatus = evt.oldStatus ?? "pending"
      if (newStatus) {
        this.ws.emitToRestaurant(evt.restaurantId, {
          type: "booking_status_changed",
          data: {
            bookingId: evt.reservationId,
            oldStatus,
            newStatus,
            restaurantId: evt.restaurantId,
          },
        })

        if (newStatus === "cancelled") {
          this.ws.emitToRestaurant(evt.restaurantId, {
            type: "booking_cancelled",
            data: {
              bookingId: evt.reservationId,
              restaurantId: evt.restaurantId,
              tableId: evt.tableId,
            },
          })
        }
      }
    }

    try {
      const summary = await this.analytics.getSummary(evt.restaurantId, evt.date)

      const hourlyStats = summary.hourly.reduce((acc: any, x: any) => {
        acc[String(x.hour).padStart(2, "0") + ":00"] = x.reservations
        return acc
      }, {})

      const peak = summary.hourly.reduce(
        (best: any, x: any) => (x.reservations > best.reservations ? x : best),
        { hour: 0, reservations: -1 },
      )

      const hallsArray = Array.isArray(summary.halls)
        ? summary.halls
        : Object.values(summary.halls ?? {})

      const zoneStats = (hallsArray as any[]).reduce((acc: Record<string, number>, h: any) => {
        acc[h.hallId] = h.reservations ?? 0
        return acc
      }, {} as Record<string, number>)

      this.ws.emitToRestaurant(evt.restaurantId, {
        type: "metrics_update",
        data: {
          restaurantId: evt.restaurantId,
          todayBookings: summary.totalReservationsToday,
          currentOccupancy: summary.currentGuestsLoad,
          activeBookings: summary.activeReservations,
          peakHour: String(peak.hour).padStart(2, "0") + ":00",
          hourlyStats,
          zoneStats,
        },
      })
    } catch {
      // ignore analytics errors
    }
  }
}
