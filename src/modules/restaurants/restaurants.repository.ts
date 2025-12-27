import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.restaurants.findMany({
      where: { is_active: true },
      include: { cuisines: true },
    })
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurants.findFirst({
      where: { id, is_active: true },
      include: { cuisines: true },
    })
    if (!restaurant) throw new NotFoundException("Restaurant not found")
    return restaurant
  }

  getFloorPlan(restaurantId: string) {
    return this.prisma.halls.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      include: {
        tables: {
          where: { is_active: true },
          orderBy: [{ position_index: "asc" }, { table_number: "asc" }],
        },
      },
    })
  }

  findTablesByRestaurant(restaurantId: string) {
    return this.prisma.tables.findMany({
      where: {
        is_active: true,
        halls: { restaurant_id: restaurantId },
      },
      orderBy: [{ hall_id: "asc" }, { position_index: "asc" }, { table_number: "asc" }],
      include: {
        halls: { select: { id: true, name: true, restaurant_id: true } },
      },
    })
  }
}
