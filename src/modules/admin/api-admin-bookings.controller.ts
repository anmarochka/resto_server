import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"
import { ApiAdminBookingsService } from "./api-admin-bookings.service"
import { ApiAdminCreateBookingDto } from "./dto/api-admin-create-booking.dto"
import { ApiAdminUpdateBookingStatusDto } from "./dto/api-admin-update-booking-status.dto"

@ApiTags("API Admin Bookings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller("api/admin/bookings")
export class ApiAdminBookingsController {
  constructor(private readonly svc: ApiAdminBookingsService) {}

  @Get()
  list(@Query("status") status: any, @Query("search") search: string | undefined, @Req() req: any) {
    return this.svc.list(req.user.userId, { status, search })
  }

  @Post()
  create(@Body() dto: ApiAdminCreateBookingDto, @Req() req: any) {
    return this.svc.create(req.user.userId, dto)
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", new ParseUuidLoosePipe()) id: string,
    @Body() dto: ApiAdminUpdateBookingStatusDto,
    @Req() req: any,
  ) {
    return this.svc.updateStatus(req.user.userId, id, dto)
  }
}
