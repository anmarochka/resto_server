import { Module } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"
import { ReservationsService } from "./reservations.service"
import { ReservationsController } from "./reservations.controller"

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsRepository, ReservationsService],
})
export class ReservationsModule {}