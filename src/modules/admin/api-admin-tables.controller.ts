import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { PrismaService } from "../prisma/prisma.service"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { RolesGuard } from "../../common/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { ROLES } from "../../common/constants/roles.constants"
import { ParseUuidLoosePipe } from "../../common/pipes/parse-uuid-loose.pipe"

class CreateTableDto {
  hallId: string
  tableNumber: number
  seats: number
  positionIndex?: number
  isActive?: boolean
}

class UpdateTableDto {
  hallId?: string
  tableNumber?: number
  seats?: number
  positionIndex?: number
  isActive?: boolean
}

class ReorderTablesDto {
  hallId: string
  tableIds: string[]
}

@ApiTags("API Admin Tables")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller("api/admin/restaurants/:restaurantId/tables")
export class ApiAdminTablesController {
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

  @Post()
  async create(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Body() dto: CreateTableDto,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)

    const hall = await this.prisma.halls.findUnique({ where: { id: dto.hallId } })
    if (!hall) throw new NotFoundException("Hall not found")
    if (hall.restaurant_id !== restaurantId) throw new ForbiddenException("Wrong restaurant")

    const max = await this.prisma.tables.aggregate({
      where: { hall_id: dto.hallId },
      _max: { position_index: true },
    })
    const positionIndex = dto.positionIndex ?? (max._max.position_index ?? 0) + 1

    return this.prisma.tables.create({
      data: {
        hall_id: dto.hallId,
        table_number: dto.tableNumber,
        seats: dto.seats,
        position_index: positionIndex,
        is_active: dto.isActive ?? true,
      },
    })
  }

  @Patch(":tableId")
  async update(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Param("tableId", new ParseUuidLoosePipe()) tableId: string,
    @Body() dto: UpdateTableDto,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)

    const table = await this.prisma.tables.findUnique({
      where: { id: tableId },
      include: { halls: { select: { restaurant_id: true } } },
    })
    if (!table) throw new NotFoundException("Table not found")
    if (table.halls?.restaurant_id !== restaurantId) {
      throw new ForbiddenException("Wrong restaurant")
    }

    if (dto.hallId) {
      const hall = await this.prisma.halls.findUnique({ where: { id: dto.hallId } })
      if (!hall) throw new NotFoundException("Hall not found")
      if (hall.restaurant_id !== restaurantId) throw new ForbiddenException("Wrong restaurant")
    }

    return this.prisma.tables.update({
      where: { id: tableId },
      data: {
        ...(dto.hallId !== undefined ? { hall_id: dto.hallId } : {}),
        ...(dto.tableNumber !== undefined ? { table_number: dto.tableNumber } : {}),
        ...(dto.seats !== undefined ? { seats: dto.seats } : {}),
        ...(dto.positionIndex !== undefined ? { position_index: dto.positionIndex } : {}),
        ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
      },
    })
  }

  @Delete(":tableId")
  async remove(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Param("tableId", new ParseUuidLoosePipe()) tableId: string,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)

    const table = await this.prisma.tables.findUnique({
      where: { id: tableId },
      include: { halls: { select: { restaurant_id: true } } },
    })
    if (!table) throw new NotFoundException("Table not found")
    if (table.halls?.restaurant_id !== restaurantId) {
      throw new ForbiddenException("Wrong restaurant")
    }

    return this.prisma.tables.update({
      where: { id: tableId },
      data: { is_active: false },
    })
  }

  @Patch("reorder")
  async reorder(
    @Param("restaurantId", new ParseUuidLoosePipe()) restaurantId: string,
    @Body() dto: ReorderTablesDto,
    @Req() req: any,
  ) {
    await this.assertAdminRestaurant(req.user.userId, restaurantId)

    const hall = await this.prisma.halls.findUnique({ where: { id: dto.hallId } })
    if (!hall) throw new NotFoundException("Hall not found")
    if (hall.restaurant_id !== restaurantId) throw new ForbiddenException("Wrong restaurant")

    const tables = await this.prisma.tables.findMany({
      where: { id: { in: dto.tableIds }, hall_id: dto.hallId },
      select: { id: true },
    })

    if (tables.length !== dto.tableIds.length) {
      throw new BadRequestException("Some tables not found in hall")
    }

    await this.prisma.$transaction(
      dto.tableIds.map((id, idx) =>
        this.prisma.tables.update({ where: { id }, data: { position_index: idx } }),
      ),
    )

    return { ok: true }
  }
}
