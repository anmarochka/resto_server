import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import * as crypto from "crypto"
import { PrismaService } from "../prisma/prisma.service"
import { ROLES } from "../../common/constants/roles.constants"

type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async authenticateTelegram(initData: string) {
    const { isValid, telegramUser } = this.verifyTelegramInitData(initData)

    if (!isValid || !telegramUser) {
      throw new UnauthorizedException("Invalid Telegram signature")
    }

    const telegramId = BigInt(telegramUser.id)
    const fullName = `${telegramUser.first_name ?? ""} ${telegramUser.last_name ?? ""}`.trim() || "Telegram User"

    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
    })

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          telegramId,
          fullName,
          phone: `tg_${telegramUser.id}`, // временно, позже заменим на нормальный ввод телефона
          role: ROLES.USER,
        },
      }))

    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      telegramId: user.telegramId?.toString(),
    })

    return {
      accessToken,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
      },
    }
  }

  private verifyTelegramInitData(initData: string): { isValid: boolean; telegramUser: TelegramUser | null } {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return { isValid: false, telegramUser: null }

    const params = new URLSearchParams(initData)
    const hash = params.get("hash")
    params.delete("hash")

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n")

    const secretKey = crypto.createHash("sha256").update(botToken).digest()
    const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    const userRaw = params.get("user")
    const telegramUser = userRaw ? (JSON.parse(userRaw) as TelegramUser) : null

    return { isValid: computedHash === hash, telegramUser }
  }
}
