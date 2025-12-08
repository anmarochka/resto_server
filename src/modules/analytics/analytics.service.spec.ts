import { AnalyticsService } from "./analytics.service"

describe("AnalyticsService", () => {
  it("getSummary returns counters", async () => {
    const prismaMock: any = {
      reservation: {
        count: jest
          .fn()
          .mockResolvedValueOnce(120) // total
          .mockResolvedValueOnce(18) // cancelled
          .mockResolvedValueOnce(102), // active
      },
    }

    const s = new AnalyticsService(prismaMock)
    await expect(s.getSummary()).resolves.toEqual({
      totalReservations: 120,
      cancelled: 18,
      active: 102,
    })
  })
})