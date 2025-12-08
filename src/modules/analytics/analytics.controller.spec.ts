import { AnalyticsController } from "./analytics.controller"

describe("AnalyticsController", () => {
  it("summary delegates to service", async () => {
    const svc: any = { getSummary: jest.fn().mockResolvedValue({ totalReservations: 1, cancelled: 0, active: 1 }) }
    const c = new AnalyticsController(svc)

    await expect(c.summary()).resolves.toEqual({ totalReservations: 1, cancelled: 0, active: 1 })
    expect(svc.getSummary).toHaveBeenCalled()
  })
})