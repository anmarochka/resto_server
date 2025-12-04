import { Module } from "@nestjs/common"
import { AppLoggerModule } from "./common/logger/logger.module"
import { HealthModule } from "./modules/health/health.module"

@Module({
  imports: [
    AppLoggerModule,
    HealthModule,
    // остальные модули ниже
  ],
})
export class AppModule {}
