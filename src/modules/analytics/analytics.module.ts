import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { AnalyticsController } from "./analytics.controller"
import { AnalyticsService } from "./analytics.service"
import { AnalyticsGateway } from "./analytics.gateway"
import { AnalyticsEventBus } from "./analytics.event-bus"
import { AnalyticsProcessor } from "./analytics.processor"
import { AnalyticsSyncService } from "./analytics.sync.service"
import { ApiAdminAnalyticsController } from "./api-admin-analytics.controller"
import { WsEventsBridge } from "./ws-events.bridge"
import { WsModule } from "../ws/ws.module"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_secret",
    }),
    WsModule,
    PrismaModule,
  ],
  controllers: [AnalyticsController, ApiAdminAnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsGateway,
    AnalyticsEventBus,
    AnalyticsProcessor,
    AnalyticsSyncService,
    WsEventsBridge,
  ],
  exports: [AnalyticsEventBus],
})
export class AnalyticsModule {}