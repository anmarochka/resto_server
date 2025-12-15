import { Injectable, OnModuleInit } from "@nestjs/common"
import { RedisService } from "../redis/redis.service"
import { AnalyticsEventBus } from "./analytics.event-bus"
import type { ReservationAnalyticsEvent } from "./analytics.events"
import { AnalyticsGateway } from "./analytics.gateway"

function hourFromTime(hhMm: string) {
  const h = Number(hhMm.slice(0, 2))
  return Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 0
}

@Injectable()
export class AnalyticsProcessor implements OnModuleInit {
  constructor(
    private readonly redis: RedisService,
    private readonly bus: AnalyticsEventBus,
    private readonly gateway: AnalyticsGateway,
  ) {}

  onModuleInit() {
    this.bus.on((evt) => void this.process(evt))
  }

  private async process(evt: ReservationAnalyticsEvent) {
    const r = this.redis.raw()
    const dayKey = `analytics:today:${evt.restaurantId}:${evt.date}`
    const hourlyKey = `analytics:hourly:${evt.restaurantId}:${evt.date}`
    const hallsKey = `analytics:halls:${evt.restaurantId}`
    const liveKey = `analytics:live_events:${evt.restaurantId}`
    const upcomingKey = `analytics:upcoming:${evt.restaurantId}:${evt.date}`
    const restaurantsKey = `analytics:restaurants`

    const hour = hourFromTime(evt.timeFrom)
    const startTs = new Date(`${evt.date}T${evt.timeFrom}:00.000Z`).getTime()

    const liveEvent = {
      ...evt,
      ts: evt.timestamp,
    }

    const multi = r.multi()
    multi.sadd(restaurantsKey, evt.restaurantId)
    multi.lpush(liveKey, JSON.stringify(liveEvent))
    multi.ltrim(liveKey, 0, 19)

    if (evt.event === "reservation.created") {
      multi.hincrby(dayKey, "total_reservations", 1)
      multi.hincrby(dayKey, "active_reservations", 1)
      multi.hincrby(dayKey, "guests_today", evt.guests)
      multi.hincrby(dayKey, "active_guests", evt.guests)

      multi.hincrby(hourlyKey, `reservations:${hour}`, 1)
      multi.hincrby(hourlyKey, `guests:${hour}`, evt.guests)

      multi.hincrby(hallsKey, `reservations:${evt.hallId}`, 1)
      multi.hincrby(hallsKey, `guests:${evt.hallId}`, evt.guests)

      multi.zadd(upcomingKey, startTs, evt.reservationId)
      multi.hset(`analytics:reservation:${evt.reservationId}`, {
        restaurantId: evt.restaurantId,
        hallId: evt.hallId,
        tableId: evt.tableId,
        guests: String(evt.guests),
        date: evt.date,
        timeFrom: evt.timeFrom,
        timeTo: evt.timeTo,
      })
      multi.expire(`analytics:reservation:${evt.reservationId}`, 60 * 60 * 24 * 8)
    }

    if (evt.event === "reservation.cancelled") {
      multi.hincrby(dayKey, "cancelled_reservations", 1)
      multi.hincrby(dayKey, "active_reservations", -1)
      multi.hincrby(dayKey, "active_guests", -evt.guests)
      multi.zrem(upcomingKey, evt.reservationId)
    }

    await multi.exec()

    const summary = await this.buildSummary(evt.restaurantId, evt.date)
    this.gateway.emitToRestaurant(evt.restaurantId, "analytics:update", summary)
    this.gateway.emitToRestaurant(evt.restaurantId, "analytics:live_event", liveEvent)
    this.gateway.emitToRestaurant(evt.restaurantId, "analytics:chart_update", {
      date: evt.date,
      hourly: summary.hourly,
      halls: summary.halls,
    })
  }

  private async buildSummary(restaurantId: string, date: string) {
    const r = this.redis.raw()
    const dayKey = `analytics:today:${restaurantId}:${date}`
    const hourlyKey = `analytics:hourly:${restaurantId}:${date}`
    const hallsKey = `analytics:halls:${restaurantId}`
    const liveKey = `analytics:live_events:${restaurantId}`
    const upcomingKey = `analytics:upcoming:${restaurantId}:${date}`

    const [day, hourly, halls, live, nearestIds] = await Promise.all([
      r.hgetall(dayKey),
      r.hgetall(hourlyKey),
      r.hgetall(hallsKey),
      r.lrange(liveKey, 0, 19),
      r.zrangebyscore(upcomingKey, Date.now(), "+inf", "LIMIT", 0, 1),
    ])

    const nearestId = nearestIds?.[0]
    const nearest = nearestId ? await r.hgetall(`analytics:reservation:${nearestId}`) : null

    const hourlyOut = Array.from({ length: 24 }).map((_, h) => ({
      hour: h,
      reservations: Number(hourly[`reservations:${h}`] ?? 0),
      guests: Number(hourly[`guests:${h}`] ?? 0),
    }))

    const hallsOut = Object.entries(halls)
      .reduce((acc, [k, v]) => {
        const [kind, hallId] = k.split(":")
        if (!hallId) return acc
        const slot = (acc[hallId] ??= { hallId, reservations: 0, guests: 0 })
        if (kind === "reservations") slot.reservations = Number(v ?? 0)
        if (kind === "guests") slot.guests = Number(v ?? 0)
        return acc
      }, {} as Record<string, { hallId: string; reservations: number; guests: number }>)
    return {
      date,
      totalReservationsToday: Number(day.total_reservations ?? 0),
      activeReservations: Number(day.active_reservations ?? 0),
      guestsToday: Number(day.guests_today ?? 0),
      currentGuestsLoad: Number(day.active_guests ?? 0),
      cancelledToday: Number(day.cancelled_reservations ?? 0),
      nearestReservation: nearestId
        ? { reservationId: nearestId, ...nearest }
        : null,
      liveEvents: live.map((s) => JSON.parse(s)),
      hourly: hourlyOut,
      halls: Object.values(hallsOut),
    }
  }
}