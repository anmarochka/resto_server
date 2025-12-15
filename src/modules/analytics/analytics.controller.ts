import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"
import { AnalyticsService } from "./analytics.service"

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: "Get real-time summary (Redis)" })
  @ApiQuery({ name: "restaurantId", required: true, type: String })
  @ApiQuery({ name: "date", required: true, type: String, example: "2025-12-05" })
  @ApiOkResponse({
    schema: { example: { totalReservationsToday: 2, currentGuestsLoad: 5 } },
  })
  @Get("summary")
  summary(
    @Query("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Query("date") date: string,
  ) {
    return this.analyticsService.getSummary(restaurantId, date)
  }
}