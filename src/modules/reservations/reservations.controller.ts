import { Body, Controller, Param, Patch, Post } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { ReservationsService } from "./reservations.service"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { CancelReservationDto } from "./dto/cancel-reservation.dto"

@ApiTags("Reservations")
@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.createReservation(dto)
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @Body() dto: CancelReservationDto) {
    return this.reservationsService.cancelReservation(id, dto.reason)
  }
}