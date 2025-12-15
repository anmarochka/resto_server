import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { AnalyticsController } from "./analytics.controller"
import { AnalyticsService } from "./analytics.service"
import { AnalyticsGateway } from "./analytics.gateway"
import { AnalyticsEventBus } from "./analytics.event-bus"
import { AnalyticsProcessor } from "./analytics.processor"
import { AnalyticsSyncService } from "./analytics.sync.service"

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_secret",
    }),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsGateway,
    AnalyticsEventBus,
    AnalyticsProcessor,
    AnalyticsSyncService,
  ],
  exports: [AnalyticsEventBus],
})
export class AnalyticsModule {}