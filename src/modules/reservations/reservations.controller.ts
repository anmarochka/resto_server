import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { ReservationsService } from "./reservations.service"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { CancelReservationDto } from "./dto/cancel-reservation.dto"

@ApiTags("Reservations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: "Create a reservation (1 active reservation per hall)" })
  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.createReservation(dto)
  }

  @ApiOperation({ summary: "Cancel a reservation by id" })
  @HttpCode(HttpStatus.OK)
  @Patch(":id/cancel")
  cancel(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: CancelReservationDto
  ) {
    return this.reservationsService.cancelReservation(id, dto.reason)
  }
}