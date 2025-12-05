// halls.module.ts
import { Module } from "@nestjs/common"
import { HallsService } from "./halls.service"
import { HallsRepository } from "./halls.repository"
import { HallsController } from "./halls.controller"

@Module({
  controllers: [HallsController],
  providers: [HallsService, HallsRepository],
})
export class HallsModule {}
