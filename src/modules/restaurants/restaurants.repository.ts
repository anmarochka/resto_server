import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.restaurants.findMany({
      where: { is_active: true },
    })
  }
}
