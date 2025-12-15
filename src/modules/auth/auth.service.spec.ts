import { UnauthorizedException } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "./auth.service"
import { PrismaService } from "../prisma/prisma.service"
import { ROLES } from "../../common/constants/roles.constants"

describe("AuthService", () => {
  let service: AuthService

  const prismaMock: any = {
    users: {
      findUnique: jest.fn(),
    },
  }

  const jwtMock: any = {
    signAsync: jest.fn().mockResolvedValue("jwt_token"),
  }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile()

    service = moduleRef.get(AuthService)
    jest.clearAllMocks()
  })

  it("authenticateTelegram: existing user -> returns token", async () => {
    ;(service as any).verifyTelegramInitData = jest.fn().mockReturnValue({
      isValid: true,
      telegramUser: { id: 123, first_name: "A", last_name: "B" },
    })

    prismaMock.users.findUnique.mockResolvedValue({
      id: "u1",
      role: ROLES.USER,
      telegram_id: BigInt(123),
    })

    const res = await service.authenticateTelegram("initData")

    expect(jwtMock.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: "u1", role: ROLES.USER, telegramId: 123 })
    )
    expect(res).toEqual({ accessToken: "jwt_token" })
  })

  it("authenticateTelegram: invalid signature -> 401", async () => {
    ;(service as any).verifyTelegramInitData = jest.fn().mockReturnValue({
      isValid: false,
      telegramUser: null,
    })

    await expect(service.authenticateTelegram("bad")).rejects.toBeInstanceOf(UnauthorizedException)
  })
})