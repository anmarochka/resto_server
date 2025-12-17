import { Module } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"
import { ReservationsService } from "./reservations.service"
import { ReservationsController } from "./reservations.controller"
import { AnalyticsModule } from "../analytics/analytics.module"
import { ApiBookingsController } from "./api-bookings.controller"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [AnalyticsModule, PrismaModule],
  controllers: [ReservationsController, ApiBookingsController],
  providers: [ReservationsRepository, ReservationsService],
})
export class ReservationsModule {}