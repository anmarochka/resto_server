// admin.controller.ts
import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { AdminService } from "./admin.service"

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: "Admin: list reservations (optionally filtered by status)" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["pending", "confirmed", "cancelled", "completed"],
  })
  @Get("reservations")
  getReservations(
    @Query("status")
    status?: "pending" | "confirmed" | "cancelled" | "completed",
  ) {
    return this.adminService.getReservations({ status })
  }
}
