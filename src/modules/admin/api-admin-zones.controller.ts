import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { PrismaService } from "../prisma/prisma.service"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"

class CreateZoneDto {
  name: string
  colorCode: string
  sortOrder?: number
}

class UpdateZoneDto {
  name?: string
  colorCode?: string
  sortOrder?: number
}

class ReorderZonesDto {
  zoneIds: string[]
}

@ApiTags("API Admin Zones")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller("api/admin/restaurants/:restaurantId/zones")
export class ApiAdminZonesController {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAdminRestaurant(adminId: string, restaurantId: string) {
    const u = await this.prisma.users.findUnique({
      where: { id: adminId },
      select: { restaurant_id: true },
    })
    if (!u?.restaurant_id || u.restaurant_id !== restaurantId) {
      throw new ForbiddenException("Wrong restaurant")
    }
  }

  @Get()
  async list(@Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string, @Req() req: any) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)
    return this.prisma.halls.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    })
  }

  @Post()
  async create(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Body() dto: CreateZoneDto,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)
    return this.prisma.halls.create({
      data: {
        restaurant_id: restaurantId,
        name: dto.name,
        color_code: dto.colorCode,
        sort_order: dto.sortOrder ?? 0,
      },
    })
  }

  @Patch(":zoneId")
  async update(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Param("zoneId", new ParseUuidLoosePipe()) zoneId: string,
    @Body() dto: UpdateZoneDto,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)
    return this.prisma.halls.update({
      where: { id: zoneId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.colorCode !== undefined ? { color_code: dto.colorCode } : {}),
        ...(dto.sortOrder !== undefined ? { sort_order: dto.sortOrder } : {}),
      },
    })
  }

  @Delete(":zoneId")
  async remove(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Param("zoneId", new ParseUuidLoosePipe()) zoneId: string,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)
    return this.prisma.halls.delete({ where: { id: zoneId } })
  }

  @Patch("reorder")
  async reorder(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Body() dto: ReorderZonesDto,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)

    await this.prisma.$transaction(
      dto.zoneIds.map((id, idx) =>
        this.prisma.halls.update({ where: { id }, data: { sort_order: idx } })
      ),
    )

    return { ok: true }
  }
}
