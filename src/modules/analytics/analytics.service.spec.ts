import { AnalyticsService } from "./analytics.service"

describe("AnalyticsService", () => {
  it("getSummary returns counters from Redis", async () => {
    const redisMock: any = {
      raw: () => ({
        hgetall: jest
          .fn()
          .mockResolvedValueOnce({
            total_reservations: "2",
            active_reservations: "1",
            guests_today: "5",
            active_guests: "3",
            cancelled_reservations: "1",
          })
          .mockResolvedValueOnce({ "reservations:19": "2", "guests:19": "5" })
          .mockResolvedValueOnce({ "reservations:hall-1": "2", "guests:hall-1": "5" })
          .mockResolvedValueOnce({ restaurantId: "rest-1" }),
        lrange: jest.fn().mockResolvedValue(["{\"event\":\"reservation.created\"}"]),
        zrangebyscore: jest.fn().mockResolvedValue(["res-1"]),
      }),
    }

    const s = new AnalyticsService(redisMock)

    const res = await s.getSummary("rest-1", "2025-12-05")

    expect(res.totalReservationsToday).toBe(2)
    expect(res.activeReservations).toBe(1)
    expect(res.guestsToday).toBe(5)
    expect(res.currentGuestsLoad).toBe(3)
    expect(res.cancelledToday).toBe(1)
    expect(Array.isArray(res.hourly)).toBe(true)
    expect(Array.isArray(res.liveEvents)).toBe(true)
  })
})