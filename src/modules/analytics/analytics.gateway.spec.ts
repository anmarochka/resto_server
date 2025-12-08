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
})