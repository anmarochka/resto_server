import { Module } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"
import { ReservationsService } from "./reservations.service"
import { ReservationsController } from "./reservations.controller"
import { AnalyticsModule } from "../analytics/analytics.module"

@Module({
  imports: [AnalyticsModule],
  controllers: [ReservationsController],
  providers: [ReservationsRepository, ReservationsService],
})
export class ReservationsModule {}