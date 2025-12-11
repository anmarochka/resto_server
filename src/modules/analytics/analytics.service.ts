import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalReservations, cancelled, active] = await Promise.all([
      this.prisma.reservations.count(),
      this.prisma.reservations.count({ where: { status: "cancelled" } }),
      this.prisma.reservations.count({ where: { status: { in: ["pending", "confirmed"] } } }),
    ])

    return {
      totalReservations,
      cancelled,
      active,
    }
  }
}