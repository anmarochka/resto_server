import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createActive(hallId: string) {
    return this.prisma.$transaction(async (tx) => {
      const hall = await tx.hall.findUnique({ where: { id: hallId } })
      if (!hall) throw new NotFoundException("Hall not found")

      const existingActive = await tx.reservation.findFirst({
        where: { hallId, status: "active" },
      })

      if (existingActive) {
        throw new ConflictException("Active reservation already exists for this hall")
      }

      return tx.reservation.create({
        data: {
          hallId,
          status: "active",
        },
      })
    })
  }

  async cancel(id: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findUnique({ where: { id } })
      if (!existing) throw new NotFoundException("Reservation not found")

      if (existing.status === "canceled") {
        throw new ConflictException("Reservation is already canceled")
      }

      return tx.reservation.update({
        where: { id },
        data: { status: "canceled", cancelReason: reason },
      })
    })
  }
}