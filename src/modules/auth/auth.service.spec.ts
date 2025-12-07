import { UnauthorizedException } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "./auth.service"
import { PrismaService } from "../prisma/prisma.service"
import { ROLES } from "../../common/constants/roles.constants"

describe("AuthService", () => {
  let service: AuthService

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService

  const jwtMock = {
    sign: jest.fn().mockReturnValue("jwt_token"),
  } as unknown as JwtService

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

    prismaMock.user.findUnique = jest.fn().mockResolvedValue({
      id: "u1",
      role: ROLES.USER,
      fullName: "A B",
      telegramId: BigInt(123),
    })

    const res = await service.authenticateTelegram("initData")

    expect(jwtMock.sign).toHaveBeenCalled()
    expect(res.accessToken).toBe("jwt_token")
    expect(res.user).toEqual({ id: "u1", role: ROLES.USER, fullName: "A B" })
  })

  it("authenticateTelegram: invalid signature -> 401", async () => {
    ;(service as any).verifyTelegramInitData = jest.fn().mockReturnValue({
      isValid: false,
      telegramUser: null,
    })

    await expect(service.authenticateTelegram("bad")).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })
})