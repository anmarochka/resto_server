import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { ReservationsService } from "./reservations.service"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { CancelReservationDto } from "./dto/cancel-reservation.dto"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"

@ApiTags("Reservations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: "Create a reservation" })
  @Post()
  create(@Body() dto: CreateReservationDto, @Req() req: any) {
    return this.reservationsService.createReservation(dto, req.user.userId)
  }

  @ApiOperation({ summary: "Cancel a reservation by id" })
  @HttpCode(HttpStatus.OK)
  @Patch(":id/cancel")
  cancel(@Param("id", new ParseUuidLoosePipe()) id: string, @Body() dto: CancelReservationDto) {
    return this.reservationsService.cancelReservation(id, dto.reason)
  }
}