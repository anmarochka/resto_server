import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalReservations, cancelled, active] = await Promise.all([
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: "canceled" } }),
      this.prisma.reservation.count({ where: { status: "active" } }),
    ])

    return {
      totalReservations,
      cancelled,
      active,
    }
  }
}