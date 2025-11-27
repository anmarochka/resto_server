// halls.module.ts
import { Module } from "@nestjs/common"
import { HallsService } from "./halls.service"
import { HallsRepository } from "./halls.repository"

@Module({
  providers: [HallsService, HallsRepository],
})
export class HallsModule {}
