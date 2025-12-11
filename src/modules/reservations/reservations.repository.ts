import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateReservationDto } from "./dto/create-reservation.dto"

function parseDateOnly(yyyyMmDd: string) {
  // Date-only: используем UTC полночь, чтобы Prisma отправил DATE
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new BadRequestException("Invalid date")
  return d
}

function parseTimeOnly(hhMm: string) {
  const d = new Date(`1970-01-01T${hhMm}:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new BadRequestException("Invalid time")
  return d
}

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const hall = await tx.halls.findUnique({ where: { id: dto.hallId } })
      if (!hall) throw new NotFoundException("Hall not found")

      const table = await tx.tables.findUnique({ where: { id: dto.tableId } })
      if (!table || table.hall_id !== dto.hallId) {
        throw new NotFoundException("Table not found")
      }

      const date = parseDateOnly(dto.date)
      const timeFrom = parseTimeOnly(dto.timeFrom)
      const timeTo = parseTimeOnly(dto.timeTo)

      // конфликт по столу: пересечение интервалов, считаем только активные статусы
      const conflict = await tx.reservations.findFirst({
        where: {
          table_id: dto.tableId,
          date,
          status: { in: ["pending", "confirmed"] },
          AND: [{ time_from: { lt: timeTo } }, { time_to: { gt: timeFrom } }],
        },
      })

      if (conflict) {
        throw new ConflictException("Time slot is already reserved")
      }

      return tx.reservations.create({
        data: {
          restaurant_id: dto.restaurantId,
          hall_id: dto.hallId,
          table_id: dto.tableId,
          user_id: userId,
          created_by_type: "user",
          guest_name: dto.guestName,
          guest_phone: dto.guestPhone,
          date,
          time_from: timeFrom,
          time_to: timeTo,
          guests_count: dto.guestsCount,
          // status по умолчанию pending — можно не задавать
        },
      })
    })
  }

  async cancel(id: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reservations.findUnique({ where: { id } })
      if (!existing) throw new NotFoundException("Reservation not found")

      if (existing.status === "cancelled") {
        throw new ConflictException("Reservation is already cancelled")
      }

      return tx.reservations.update({
        where: { id },
        data: { status: "cancelled", cancel_reason: reason },
      })
    })
  }
}