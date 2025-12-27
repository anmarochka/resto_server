import { Module } from "@nestjs/common"
import { AdminController } from "./admin.controller"
import { AdminService } from "./admin.service"
import { ApiAdminBookingsController } from "./api-admin-bookings.controller"
import { ApiAdminBookingsService } from "./api-admin-bookings.service"
import { ApiAdminZonesController } from "./api-admin-zones.controller"
import { ApiAdminTablesController } from "./api-admin-tables.controller"
import { PrismaModule } from "../prisma/prisma.module"
import { AnalyticsModule } from "../analytics/analytics.module"

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [
    AdminController,
    ApiAdminBookingsController,
    ApiAdminZonesController,
    ApiAdminTablesController,
  ],
  providers: [AdminService, ApiAdminBookingsService],
})
export class AdminModule {}
