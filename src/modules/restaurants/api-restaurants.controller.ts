import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { UpdateTableStatusDto } from "./dto/update-table-status.dto"
import { ApiRestaurantsService } from "./api-restaurants.service"

@ApiTags("API Restaurants")
@Controller("api/restaurants")
export class ApiRestaurantsController {
  constructor(private readonly svc: ApiRestaurantsService) {}

  @Get()
  getAll() {
    return this.svc.getAll()
  }

  @Get(":id")
  getById(@Param("id", new ParseUuidLoosePipe()) id: string) {
    return this.svc.getById(id)
  }

  @Get(":restaurantId/floor-plan")
  floorPlan(@Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string) {
    return this.svc.getFloorPlan(restaurantId)
  }

  @Get(":restaurantId/tables")
  tables(@Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string) {
    return this.svc.getTables(restaurantId)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  @Patch(":restaurantId/tables/:tableId/status")
  patchStatus(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Param("tableId", new ParseUuidLoosePipe()) tableId: string,
    @Body() dto: UpdateTableStatusDto,
  ) {
    return this.svc.updateTableStatus(restaurantId, tableId, dto.status)
  }
}
