import { Injectable } from "@nestjs/common"
import { RedisService } from "../redis/redis.service"

@Injectable()
export class AnalyticsService {
  constructor(private readonly redis: RedisService) {}

  async getSummary(restaurantId: string, date: string) {
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

    return {
      date,
      totalReservationsToday: Number(day.total_reservations ?? 0),
      activeReservations: Number(day.active_reservations ?? 0),
      guestsToday: Number(day.guests_today ?? 0),
      currentGuestsLoad: Number(day.active_guests ?? 0),
      cancelledToday: Number(day.cancelled_reservations ?? 0),
      nearestReservation: nearestId ? { reservationId: nearestId, ...nearest } : null,
      liveEvents: live.map((s) => JSON.parse(s)),
      hourly: Array.from({ length: 24 }).map((_, h) => ({
        hour: h,
        reservations: Number(hourly[`reservations:${h}`] ?? 0),
        guests: Number(hourly[`guests:${h}`] ?? 0),
      })),
      halls: Object.entries(halls).reduce((acc, [k, v]) => {
        const [kind, hallId] = k.split(":")
        if (!hallId) return acc
        const slot = (acc[hallId] ??= { hallId, reservations: 0, guests: 0 })
        if (kind === "reservations") slot.reservations = Number(v ?? 0)
        if (kind === "guests") slot.guests = Number(v ?? 0)
        return acc
      }, {} as Record<string, { hallId: string; reservations: number; guests: number }>),
    }
  }
}