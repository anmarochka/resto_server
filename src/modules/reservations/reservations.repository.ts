import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { hallId: string }) {
    return this.prisma.reservation.create({
      data: {
        hallId: data.hallId,
      },
    })
  }

  cancel(id: string, reason: string) {
    return this.prisma.reservation.update({
      where: { id },
      data: { status: "canceled", cancelReason: reason },
    })
  }
}