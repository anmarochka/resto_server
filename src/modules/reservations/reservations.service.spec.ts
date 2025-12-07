import { Test } from "@nestjs/testing"
import { ReservationsService } from "./reservations.service"
import { ReservationsRepository } from "./reservations.repository"
import { AnalyticsGateway } from "../analytics/analytics.gateway"

describe("ReservationsService", () => {
  let service: ReservationsService

  const repoMock = {
    createActive: jest.fn(),
    cancel: jest.fn(),
  } as unknown as ReservationsRepository

  const gatewayMock = {
    emitReservationCreated: jest.fn(),
    emitReservationCancelled: jest.fn(),
  } as unknown as AnalyticsGateway

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: ReservationsRepository, useValue: repoMock },
        { provide: AnalyticsGateway, useValue: gatewayMock },
      ],
    }).compile()

    service = moduleRef.get(ReservationsService)
    jest.clearAllMocks()
  })

  it("createReservation: creates and emits reservation_created", async () => {
    repoMock.createActive = jest.fn().mockResolvedValue({ id: "r1" })

    const res = await service.createReservation({ hallId: "h1" } as any)

    expect(repoMock.createActive).toHaveBeenCalledWith("h1")
    expect(gatewayMock.emitReservationCreated).toHaveBeenCalledWith({ id: "r1" })
    expect(res).toEqual({ id: "r1" })
  })

  it("cancelReservation: cancels and emits reservation_cancelled", async () => {
    repoMock.cancel = jest.fn().mockResolvedValue({ id: "r1", status: "canceled" })

    const res = await service.cancelReservation("r1", "reason")

    expect(repoMock.cancel).toHaveBeenCalledWith("r1", "reason")
    expect(gatewayMock.emitReservationCancelled).toHaveBeenCalledWith({
      id: "r1",
      status: "canceled",
    })
    expect(res.status).toBe("canceled")
  })
})