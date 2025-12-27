import { Controller, ForbiddenException, Get, Param, Query, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"
import { PrismaService } from "../prisma/prisma.service"
import { AnalyticsService } from "./analytics.service"

@ApiTags("API Admin Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller("api/admin/analytics")
export class ApiAdminAnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdminRestaurant(adminId: string, restaurantId: string) {
    const u = await this.prisma.users.findUnique({
      where: { id: adminId },
      select: { restaurant_id: true },
    })
    if (!u?.restaurant_id || u.restaurant_id !== restaurantId) {
      throw new ForbiddenException("Wrong restaurant")
    }
  }

  private today() {
    return new Date().toISOString().slice(0, 10)
  }

  @Get(":restaurantId")
  async get(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Query("date") date: string | undefined,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)
    return this.analytics.getSnapshot(restaurantId, date ?? this.today())
  }

  @Get(":restaurantId/realtime")
  async realtime(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Query("date") date: string | undefined,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)
    return this.analytics.getSnapshot(restaurantId, date ?? this.today())
  }
}
