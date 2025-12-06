import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getReservations(filter: { status?: "active" | "canceled" }) {
    return this.prisma.reservation.findMany({
      where: filter.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        hall: {
          include: {
            restaurant: true,
          },
        },
      },
    })
  }
}