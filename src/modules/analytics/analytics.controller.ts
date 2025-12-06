import { Controller, Get } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { AnalyticsService } from "./analytics.service"

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("summary")
  summary() {
    return this.analyticsService.getSummary()
  }
}