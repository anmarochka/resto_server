import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: { id: true, full_name: true, role: true, telegram_id: true, restaurant_id: true },
    })
    if (!user) return null

    return {
      id: user.id,
      fullName: user.full_name,
      role: user.role,
      telegramId: user.telegram_id ? user.telegram_id.toString() : null,
      restaurantId: user.restaurant_id,
    }
  }
}
