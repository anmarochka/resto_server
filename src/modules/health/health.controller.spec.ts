import { HealthController } from "./health.controller"

describe("HealthController", () => {
  it("health returns ok", () => {
    const c = new HealthController()
    expect(c.health()).toEqual({ status: "ok" })
  })
})