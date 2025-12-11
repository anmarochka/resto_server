import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed"

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getReservations(filter: { status?: ReservationStatus }) {
    // было: this.prisma.reservation.findMany + createdAt + hall/restaurant
    return this.prisma.reservations.findMany({
      where: filter.status ? { status: filter.status } : undefined,
      orderBy: { created_at: "desc" },
      include: {
        halls: {
          include: {
            restaurants: true,
          },
        },
      },
    })
  }
}