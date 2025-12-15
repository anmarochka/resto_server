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

  it("create: hall not found -> 404", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        halls: { findUnique: jest.fn().mockResolvedValue(null) },
        tables: { findUnique: jest.fn() },
        reservations: { findFirst: jest.fn(), create: jest.fn() },
      })
    )

    const dto: any = {
      restaurantId: "rest-1",
      hallId: "hall-1",
      tableId: "table-1",
      date: "2025-12-05",
      timeFrom: "19:00",
      timeTo: "21:00",
      guestsCount: 2,
    }

    await expect(repo.create(dto, "user-1")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("create: existing conflict -> 409", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        halls: { findUnique: jest.fn().mockResolvedValue({ id: "hall-1" }) },
        tables: { findUnique: jest.fn().mockResolvedValue({ id: "table-1", hall_id: "hall-1" }) },
        reservations: {
          findFirst: jest.fn().mockResolvedValue({ id: "r1" }),
          create: jest.fn(),
        },
      })
    )

    const dto: any = {
      restaurantId: "rest-1",
      hallId: "hall-1",
      tableId: "table-1",
      date: "2025-12-05",
      timeFrom: "19:00",
      timeTo: "21:00",
      guestsCount: 2,
    }

    await expect(repo.create(dto, "user-1")).rejects.toBeInstanceOf(ConflictException)
  })

  it("cancel: reservation not found -> 404", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        reservations: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      })
    )

    await expect(repo.cancel("r1", "reason")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("cancel: already cancelled -> 409", async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        reservations: {
          findUnique: jest.fn().mockResolvedValue({ id: "r1", status: "cancelled" }),
          update: jest.fn(),
        },
      })
    )

    await expect(repo.cancel("r1", "reason")).rejects.toBeInstanceOf(ConflictException)
  })
})