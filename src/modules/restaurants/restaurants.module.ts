import { Module } from "@nestjs/common"
import { RestaurantsController } from "./restaurants.controller"
import { RestaurantsService } from "./restaurants.service"
import { RestaurantsRepository } from "./restaurants.repository"
import { ApiRestaurantsController } from "./api-restaurants.controller"
import { ApiRestaurantsService } from "./api-restaurants.service"
import { RedisModule } from "../redis/redis.module"
import { WsModule } from "../ws/ws.module"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [RedisModule, WsModule, PrismaModule],
  controllers: [RestaurantsController, ApiRestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository, ApiRestaurantsService],
})
export class RestaurantsModule {}
