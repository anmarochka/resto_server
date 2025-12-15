import { AnalyticsGateway } from "./analytics.gateway"

describe("AnalyticsGateway", () => {
  it("emitReservationCreated emits expected events", () => {
    const g = new AnalyticsGateway()
    ;(g as any).server = { emit: jest.fn() }

    g.emitReservationCreated({ id: "r1" })

    expect((g as any).server.emit).toHaveBeenCalledWith("reservation_created", { id: "r1" })
    expect((g as any).server.emit).toHaveBeenCalledWith("analytics:update", {
      type: "reservation_created",
      payload: { id: "r1" },
    })
  })

  it("emitReservationCancelled emits expected events", () => {
    const g = new AnalyticsGateway()
    ;(g as any).server = { emit: jest.fn() }

    g.emitReservationCancelled({ id: "r1" })

    expect((g as any).server.emit).toHaveBeenCalledWith("reservation_cancelled", { id: "r1" })
    expect((g as any).server.emit).toHaveBeenCalledWith("analytics:update", {
      type: "reservation_cancelled",
      payload: { id: "r1" },
    })
  })

  it("emitToRestaurant emits into restaurant room", () => {
    const jwtMock: any = {}
    const prismaMock: any = {}

    const g = new AnalyticsGateway(jwtMock, prismaMock)

    const emit = jest.fn()
    ;(g as any).server = {
      to: jest.fn().mockReturnValue({ emit }),
    }

    g.emitToRestaurant("rest-1", "analytics:update", { x: 1 })

    expect((g as any).server.to).toHaveBeenCalledWith("restaurant:rest-1")
    expect(emit).toHaveBeenCalledWith("analytics:update", { x: 1 })
  })
})