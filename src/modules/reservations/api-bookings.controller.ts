import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"
import { ReservationsService } from "./reservations.service"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { CancelReservationDto } from "./dto/cancel-reservation.dto"
import { ROLES } from "../../common/constants/roles.constants"
import { ForbiddenException } from "@nestjs/common"

@ApiTags("API Bookings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/bookings")
export class ApiBookingsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get()
  list(@Query("userId") userId: string | undefined, @Req() req: any) {
    const callerId = req.user.userId as string
    const callerRole = req.user.role as string
    const targetUserId = userId ?? callerId

    if (targetUserId !== callerId && callerRole !== ROLES.ADMIN) {
      throw new ForbiddenException("Cannot read other user's bookings")
    }

    return this.reservations.listByUser(targetUserId)
  }

  @Get(":id")
  getById(@Param("id", new ParseUuidLoosePipe()) id: string, @Req() req: any) {
    return this.reservations.getByIdForCaller(id, req.user.userId, req.user.role)
  }

  @Post()
  create(@Body() dto: CreateReservationDto, @Req() req: any) {
    return this.reservations.createReservation(dto, req.user.userId)
  }

  @Patch(":id/cancel")
  cancel(@Param("id", new ParseUuidLoosePipe()) id: string, @Body() dto: CancelReservationDto) {
    return this.reservations.cancelReservation(id, dto.reason)
  }
}
