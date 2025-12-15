import { AnalyticsController } from "./analytics.controller"

describe("AnalyticsController", () => {
  it("summary delegates to service with params", async () => {
    const svc: any = { getSummary: jest.fn().mockResolvedValue({ ok: true }) }
    const c = new AnalyticsController(svc)

    await expect(
      c.summary("00000000-0000-4000-8000-000000000000", "2025-12-05")
    ).resolves.toEqual({ ok: true })

    expect(svc.getSummary).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000000",
      "2025-12-05"
    )
  })
})