import { ConflictException, NotFoundException } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"
import { PrismaService } from "../prisma/prisma.service"

describe("ReservationsRepository", () => {
  const prismaMock: any = {
    $transaction: jest.fn(),
  }

  const repo = new ReservationsRepository(prismaMock as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("createActive: hall not found -> 404", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        hall: { findUnique: jest.fn().mockResolvedValue(null) },
        reservation: { findFirst: jest.fn(), create: jest.fn() },
      })
    )

    await expect(repo.createActive("hall-id")).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it("createActive: existing active -> 409", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        hall: { findUnique: jest.fn().mockResolvedValue({ id: "h1" }) },
        reservation: {
          findFirst: jest.fn().mockResolvedValue({ id: "r1" }),
          create: jest.fn(),
        },
      })
    )

    await expect(repo.createActive("h1")).rejects.toBeInstanceOf(
      ConflictException
    )
  })

  it("cancel: reservation not found -> 404", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        reservation: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      })
    )

    await expect(repo.cancel("r1", "reason")).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it("cancel: already canceled -> 409", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        reservation: {
          findUnique: jest.fn().mockResolvedValue({ id: "r1", status: "canceled" }),
          update: jest.fn(),
        },
      })
    )

    await expect(repo.cancel("r1", "reason")).rejects.toBeInstanceOf(
      ConflictException
    )
  })
})