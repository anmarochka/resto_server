import { HallsController } from "./halls.controller"

describe("HallsController", () => {
  it("getByRestaurant delegates to service", async () => {
    const svc: any = { getByRestaurant: jest.fn().mockResolvedValue([{ id: "h1" }]) }
    const c = new HallsController(svc)

    await expect(c.getByRestaurant("00000000-0000-4000-8000-000000000000")).resolves.toEqual([
      { id: "h1" },
    ])
    expect(svc.getByRestaurant).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000000")
  })
})