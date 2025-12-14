import { Controller, Get, Query } from "@nestjs/common"
import { ApiQuery, ApiTags } from "@nestjs/swagger"
import { HallsService } from "./halls.service"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"

@ApiTags("Halls")
@Controller("halls")
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @ApiQuery({ name: "restaurantId", required: true, type: String })
  @Get()
  getByRestaurant(@Query("restaurantId", new ParseUuidLoosePipe()) restaurantId: string) {
    return this.hallsService.getByRestaurant(restaurantId)
  }
}