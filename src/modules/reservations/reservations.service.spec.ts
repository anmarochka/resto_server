import { Test } from "@nestjs/testing"
import { ReservationsService } from "./reservations.service"
import { ReservationsRepository } from "./reservations.repository"
import { AnalyticsEventBus } from "../analytics/analytics.event-bus"

describe("ReservationsService", () => {
  let service: ReservationsService

  const repoMock = {
    create: jest.fn(),
    cancel: jest.fn(),
  } as unknown as ReservationsRepository

  const busMock = {
    emit: jest.fn(),
    on: jest.fn(),
  } as unknown as AnalyticsEventBus

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: ReservationsRepository, useValue: repoMock },
        { provide: AnalyticsEventBus, useValue: busMock },
      ],
    }).compile()

    service = moduleRef.get(ReservationsService)
    jest.clearAllMocks()
  })

  it("createReservation: creates and emits reservation.created", async () => {
    repoMock.create = jest.fn().mockResolvedValue({
      id: "res-1",
      restaurant_id: "rest-1",
      hall_id: "hall-1",
      table_id: "table-1",
      guests_count: 4,
      date: new Date("2025-12-05T00:00:00.000Z"),
      time_from: new Date("1970-01-01T19:00:00.000Z"),
      time_to: new Date("1970-01-01T21:00:00.000Z"),
      status: "pending",
    })

    const dto: any = {
      restaurantId: "rest-1",
      hallId: "hall-1",
      tableId: "table-1",
      date: "2025-12-05",
      timeFrom: "19:00",
      timeTo: "21:00",
      guestsCount: 4,
    }

    const res = await service.createReservation(dto, "user-1")

    expect(repoMock.create).toHaveBeenCalledWith(dto, "user-1")
    expect(busMock.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "reservation.created",
        reservationId: "res-1",
        restaurantId: "rest-1",
        hallId: "hall-1",
        tableId: "table-1",
        guests: 4,
        date: "2025-12-05",
        timeFrom: "19:00",
        timeTo: "21:00",
      })
    )
    expect(res.id).toBe("res-1")
  })

  it("cancelReservation: cancels and emits reservation.cancelled", async () => {
    repoMock.cancel = jest.fn().mockResolvedValue({
      id: "res-1",
      restaurant_id: "rest-1",
      hall_id: "hall-1",
      table_id: "table-1",
      guests_count: 2,
      date: new Date("2025-12-05T00:00:00.000Z"),
      time_from: new Date("1970-01-01T18:00:00.000Z"),
      time_to: new Date("1970-01-01T20:00:00.000Z"),
      status: "cancelled",
    })

    const res = await service.cancelReservation("res-1", "reason")

    expect(repoMock.cancel).toHaveBeenCalledWith("res-1", "reason")
    expect(busMock.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "reservation.cancelled",
        reservationId: "res-1",
        restaurantId: "rest-1",
        guests: 2,
      })
    )
    expect(res.status).toBe("cancelled")
  })
})