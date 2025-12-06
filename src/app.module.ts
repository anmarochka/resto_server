import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AppLoggerModule } from "./common/logger/logger.module"
import { PrismaModule } from "./modules/prisma/prisma.module"
import { HealthModule } from "./modules/health/health.module"
import { AuthModule } from "./modules/auth/auth.module"
import { RestaurantsModule } from "./modules/restaurants/restaurants.module"
import { HallsModule } from "./modules/halls/halls.module"
import { UsersModule } from "./modules/users/users.module"
import { ReservationsModule } from "./modules/reservations/reservations.module"
import { AdminModule } from "./modules/admin/admin.module"
import { AnalyticsModule } from "./modules/analytics/analytics.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppLoggerModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    RestaurantsModule,
    HallsModule,
    UsersModule,
    ReservationsModule,
    AdminModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
