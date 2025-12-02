import { Controller, Get } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { RestaurantsService } from "./restaurants.service"

@ApiTags("Restaurants")
@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Get()
  getAll() {
    return this.service.getAll()
  }
}
