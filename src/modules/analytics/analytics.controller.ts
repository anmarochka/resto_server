import { Controller, Get } from "@nestjs/common"
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { AnalyticsService } from "./analytics.service"

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: "Get reservations summary counters" })
  @ApiOkResponse({
    schema: {
      example: { totalReservations: 120, cancelled: 18, active: 102 },
    },
  })
  @Get("summary")
  summary() {
    return this.analyticsService.getSummary()
  }
}