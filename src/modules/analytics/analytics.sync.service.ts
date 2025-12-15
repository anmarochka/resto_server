import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { RedisService } from "../redis/redis.service"

@Injectable()
export class AnalyticsSyncService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === "test") return

    // простая периодика без сторонних пакетов
    this.timer = setInterval(() => void this.flush(), 60_000)
    this.timer.unref?.()
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  private async flush() {
    const r = this.redis.raw()
    const restaurantIds = await r.smembers("analytics:restaurants")
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    for (const restaurantId of restaurantIds) {
      const dayKey = `analytics:today:${restaurantId}:${today}`
      const hourlyKey = `analytics:hourly:${restaurantId}:${today}`
      const hallsKey = `analytics:halls:${restaurantId}`

      const [day, hourly, halls] = await Promise.all([
        r.hgetall(dayKey),
        r.hgetall(hourlyKey),
        r.hgetall(hallsKey),
      ])

      const dateObj = new Date(`${today}T00:00:00.000Z`)

      await this.prisma.analytics_daily.upsert({
        where: { uq_analytics_daily_restaurant_date: { restaurant_id: restaurantId, date: dateObj } } as any,
        update: {
          total_reservations: Number(day.total_reservations ?? 0),
          pending_reservations: Number(day.active_reservations ?? 0),
          cancelled_reservations: Number(day.cancelled_reservations ?? 0),
          total_guests: Number(day.guests_today ?? 0),
        },
        create: {
          restaurant_id: restaurantId,
          date: dateObj,
          total_reservations: Number(day.total_reservations ?? 0),
          pending_reservations: Number(day.active_reservations ?? 0),
          cancelled_reservations: Number(day.cancelled_reservations ?? 0),
          total_guests: Number(day.guests_today ?? 0),
        },
      })

      for (let h = 0; h < 24; h++) {
        const reservations_count = Number(hourly[`reservations:${h}`] ?? 0)
        const guests_count = Number(hourly[`guests:${h}`] ?? 0)

        await this.prisma.analytics_hourly.upsert({
          where: { uq_analytics_hourly_restaurant_date_hour: { restaurant_id: restaurantId, date: dateObj, hour: h } } as any,
          update: { reservations_count, guests_count },
          create: { restaurant_id: restaurantId, date: dateObj, hour: h, reservations_count, guests_count },
        })
      }

      // halls popularity (за сегодня как period_from=period_to=today)
      const hallAgg = Object.entries(halls).reduce((acc, [k, v]) => {
        const [kind, hallId] = k.split(":")
        if (!hallId) return acc
        const slot = (acc[hallId] ??= { reservations: 0, guests: 0 })
        if (kind === "reservations") slot.reservations = Number(v ?? 0)
        if (kind === "guests") slot.guests = Number(v ?? 0)
        return acc
      }, {} as Record<string, { reservations: number; guests: number }>)

      for (const [hallId, v] of Object.entries(hallAgg)) {
        await this.prisma.analytics_hall_popularity.create({
          data: {
            restaurant_id: restaurantId,
            hall_id: hallId,
            period_from: dateObj,
            period_to: dateObj,
            reservations_count: v.reservations,
            guests_count: v.guests,
          },
        })
      }
    }
  }
}