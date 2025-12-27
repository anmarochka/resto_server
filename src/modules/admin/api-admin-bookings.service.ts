import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { AnalyticsEventBus } from "../analytics/analytics.event-bus"
import { ApiAdminCreateBookingDto } from "./dto/api-admin-create-booking.dto"
import { ApiAdminUpdateBookingStatusDto } from "./dto/api-admin-update-booking-status.dto"

function parseDateOnly(v: string) {
  const d = new Date(`${v}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date")
  return d
}

function parseTimeOnly(v: string) {
  const d = new Date(`1970-01-01T${v}:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new Error("Invalid time")
  return d
}

@Injectable()
export class ApiAdminBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: AnalyticsEventBus,
  ) {}

  private async adminRestaurantIdOrThrow(adminUserId: string) {
    const u = await this.prisma.users.findUnique({
      where: { id: adminUserId },
      select: { restaurant_id: true },
    })
    if (!u?.restaurant_id) throw new ForbiddenException("Admin has no restaurant assigned")
    return u.restaurant_id
  }

  async list(adminUserId: string, args: { status?: any; search?: string }) {
    const restaurantId = await this.adminRestaurantIdOrThrow(adminUserId)
    const q = args.search?.trim()
    const qAsInt = q && /^\d+$/.test(q) ? Number(q) : null

    return this.prisma.reservations.findMany({
      where: {
        restaurant_id: restaurantId,
        ...(args.status ? { status: args.status } : {}),
        ...(q
          ? {
              OR: [
                { guest_name: { contains: q, mode: "insensitive" } },
                { guest_phone: { contains: q, mode: "insensitive" } },
                ...(qAsInt !== null ? [{ tables: { table_number: qAsInt } }] : []),
              ],
            }
          : {}),
      },
      orderBy: { created_at: "desc" },
      include: { restaurants: true, halls: true, tables: true },
    })
  }

  async create(adminUserId: string, dto: ApiAdminCreateBookingDto) {
    const restaurantId = await this.adminRestaurantIdOrThrow(adminUserId)

    const created = await this.prisma.$transaction(async (tx) => {
      const hall = await tx.halls.findUnique({ where: { id: dto.hallId } })
      if (!hall) throw new NotFoundException("Hall not found")
      if (hall.restaurant_id !== restaurantId) throw new ForbiddenException("Wrong restaurant")

      const table = await tx.tables.findUnique({ where: { id: dto.tableId } })
      if (!table || table.hall_id !== dto.hallId) throw new NotFoundException("Table not found")

      const date = parseDateOnly(dto.date)
      const timeFrom = parseTimeOnly(dto.timeFrom)
      const timeTo = parseTimeOnly(dto.timeTo)

      const conflict = await tx.reservations.findFirst({
        where: {
          table_id: dto.tableId,
          date,
          status: { in: ["pending", "confirmed"] },
          AND: [{ time_from: { lt: timeTo } }, { time_to: { gt: timeFrom } }],
        },
      })
      if (conflict) throw new ConflictException("Time slot is already reserved")

      const res = await tx.reservations.create({
        data: {
          restaurant_id: restaurantId,
          hall_id: dto.hallId,
          table_id: dto.tableId,
          user_id: null,
          created_by_type: "admin",
          created_by_admin_id: adminUserId,
          guest_name: dto.guestName,
          guest_phone: dto.guestPhone,
          date,
          time_from: timeFrom,
          time_to: timeTo,
          guests_count: dto.guestsCount,
          status: "confirmed",
        },
      })

      await tx.reservation_status_history.create({
        data: {
          reservation_id: res.id,
          from_status: null,
          to_status: res.status,
          changed_by_admin_id: adminUserId,
        },
      })

      return res
    })

    this.bus.emit({
      event: "reservation.created",
      reservationId: created.id,
      restaurantId: created.restaurant_id,
      hallId: created.hall_id,
      tableId: created.table_id,
      guests: created.guests_count,
      date: created.date.toISOString().slice(0, 10),
      timeFrom: created.time_from.toISOString().slice(11, 16),
      timeTo: created.time_to.toISOString().slice(11, 16),
      timestamp: new Date().toISOString(),
      status: created.status as any,
    })

    return created
  }

  async updateStatus(adminUserId: string, bookingId: string, dto: ApiAdminUpdateBookingStatusDto) {
    const restaurantId = await this.adminRestaurantIdOrThrow(adminUserId)

    const { updated, oldStatus } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.reservations.findUnique({ where: { id: bookingId } })
      if (!existing) throw new NotFoundException("Reservation not found")
      if (existing.restaurant_id !== restaurantId) throw new ForbiddenException("Wrong restaurant")

      const upd = await tx.reservations.update({
        where: { id: bookingId },
        data: { status: dto.status },
      })

      await tx.reservation_status_history.create({
        data: {
          reservation_id: upd.id,
          from_status: existing.status,
          to_status: upd.status,
          changed_by_admin_id: adminUserId,
        },
      })

      return { updated: upd, oldStatus: existing.status }
    })

    this.bus.emit({
      event: "reservation.status_changed",
      reservationId: updated.id,
      restaurantId: updated.restaurant_id,
      hallId: updated.hall_id,
      tableId: updated.table_id,
      guests: updated.guests_count,
      date: updated.date.toISOString().slice(0, 10),
      timeFrom: updated.time_from.toISOString().slice(11, 16),
      timeTo: updated.time_to.toISOString().slice(11, 16),
      timestamp: new Date().toISOString(),
      status: updated.status as any,
      oldStatus: oldStatus as any,
      newStatus: updated.status as any,
    } as any)

    return updated
  }
}
