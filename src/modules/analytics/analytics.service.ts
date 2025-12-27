import { Injectable } from "@nestjs/common"
import { RedisService } from "../redis/redis.service"
import { PrismaService } from "../prisma/prisma.service"

type LiveEvent = {
  event: string
  reservationId: string
  restaurantId: string
  hallId: string
  tableId: string
  guests: number
  date: string
  timeFrom: string
  timeTo: string
  timestamp: string
  status?: string
  oldStatus?: string
  newStatus?: string
}

const RU_DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function dayLabelRU(d: Date) {
  return RU_DAYS[d.getDay()] ?? ""
}

function safePercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function bookingEventTitle(type: string) {
  if (type === "booking_created") return "Новое бронирование"
  if (type === "booking_confirmed") return "Подтверждено"
  if (type === "booking_cancelled") return "Отменено"
  return "Завершено"
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

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

  async getSnapshot(restaurantId: string, date: string) {
    const summary = await this.getSummary(restaurantId, date)

    const target = new Date(`${date}T00:00:00.000Z`)
    const start = new Date(target)
    start.setUTCDate(target.getUTCDate() - 6)

    const reservationsLast7 = await this.prisma.reservations.findMany({
      where: {
        restaurant_id: restaurantId,
        date: { gte: start, lte: target },
      },
      select: {
        date: true,
        guests_count: true,
        status: true,
        time_from: true,
        hall_id: true,
      },
    })

    const reservationsAll = await this.prisma.reservations.aggregate({
      where: { restaurant_id: restaurantId },
      _count: { _all: true },
      _avg: { guests_count: true },
    })

    const cancelledCount = await this.prisma.reservations.count({
      where: { restaurant_id: restaurantId, status: "cancelled" },
    })

    const halls = await this.prisma.halls.findMany({
      where: { restaurant_id: restaurantId },
      select: { id: true, name: true, sort_order: true },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    })

    const tables = await this.prisma.tables.findMany({
      where: { halls: { restaurant_id: restaurantId } },
      select: { id: true, table_number: true },
    })

    const tableNumberById = new Map(tables.map((t) => [t.id, t.table_number]))

    const reservationsByDay = new Map<string, { bookings: number; guests: number }>()
    for (const r of reservationsLast7) {
      const day = toISODate(r.date)
      const slot = reservationsByDay.get(day) ?? { bookings: 0, guests: 0 }
      slot.bookings += 1
      slot.guests += r.guests_count
      reservationsByDay.set(day, slot)
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setUTCDate(start.getUTCDate() + i)
      return d
    })

    const bookingsByDay = last7Days.map((d) => {
      const day = toISODate(d)
      const slot = reservationsByDay.get(day) ?? { bookings: 0, guests: 0 }
      return { label: dayLabelRU(d), bookings: slot.bookings, guests: slot.guests }
    })

    const hourly = Array.isArray(summary.hourly) ? summary.hourly : []
    const peak = hourly.reduce(
      (best, x) => (x.reservations > best.reservations ? x : best),
      { hour: 19, reservations: -1 },
    )

    const maxHourly = Math.max(1, ...hourly.map((h) => h.reservations ?? 0))
    const timeDistributionRaw = hourly
      .filter((h) => (h.reservations ?? 0) > 0)
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        time: String(h.hour).padStart(2, "0") + ":00",
        load: Math.max(0, Math.min(1, (h.reservations ?? 0) / maxHourly)),
      }))

    const timeDistribution =
      timeDistributionRaw.length > 0
        ? timeDistributionRaw
        : [
            { time: "18:00", load: 0 },
            { time: "19:00", load: 0 },
            { time: "20:00", load: 0 },
          ]

    const hallCounts = new Map<string, number>()
    for (const r of reservationsLast7) {
      if (r.status === "cancelled") continue
      hallCounts.set(r.hall_id, (hallCounts.get(r.hall_id) ?? 0) + 1)
    }
    const totalHall = Array.from(hallCounts.values()).reduce((s, n) => s + n, 0) || 1
    const zonePopularity = halls.map((h) => ({
      categoryId: h.id,
      label: h.name,
      percent: safePercent(((hallCounts.get(h.id) ?? 0) / totalHall) * 100),
    }))

    const totalBookings = reservationsAll._count._all ?? 0
    const avgGuests = reservationsAll._avg.guests_count ?? 0
    const cancelRate = totalBookings ? (cancelledCount / totalBookings) * 100 : 0
    const attendancePercent = safePercent(100 - cancelRate)

    const liveEvents = (summary.liveEvents ?? []) as LiveEvent[]
    const events = liveEvents.map((evt) => {
      const type =
        evt.event === "reservation.created"
          ? "booking_created"
          : evt.event === "reservation.cancelled"
            ? "booking_cancelled"
            : evt.newStatus === "confirmed"
              ? "booking_confirmed"
              : evt.newStatus === "completed"
                ? "booking_completed"
                : evt.status === "confirmed"
                  ? "booking_confirmed"
                  : "booking_created"

      const tableNumber = tableNumberById.get(evt.tableId)
      const guests = evt.guests === 1 ? "1 гость" : `${evt.guests} гостей`
      const tableLabel = tableNumber ? `Стол ${tableNumber}` : `Стол ${evt.tableId}`
      const message = `${evt.timeFrom} • ${guests} • ${tableLabel}`

      return {
        id: `${evt.reservationId}:${evt.timestamp}`,
        restaurantId: evt.restaurantId,
        type,
        title: bookingEventTitle(type),
        message,
        createdAt: evt.timestamp,
        bookingId: evt.reservationId,
      }
    })

    const bookingsToday =
      summary.totalReservationsToday > 0
        ? summary.totalReservationsToday
        : reservationsLast7.filter((r) => toISODate(r.date) === date).length

    return {
      connected: true,
      bookingsToday,
      currentGuestsLoad: summary.currentGuestsLoad ?? 0,
      peakTime: String(peak.hour ?? 19).padStart(2, "0") + ":00",
      activeBookings: summary.activeReservations ?? 0,
      events,
      bookingsByDay,
      timeDistribution,
      zonePopularity,
      totals: {
        totalBookings,
        avgGuests: Number(avgGuests.toFixed(1)),
        attendancePercent: Math.round(attendancePercent),
      },
    }
  }
}
