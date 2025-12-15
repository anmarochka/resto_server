import { AdminController } from "./admin.controller"

describe("AdminController", () => {
  it("getReservations delegates to service", async () => {
    const svc: any = { getReservations: jest.fn().mockResolvedValue([{ id: "r1" }]) }
    const c = new AdminController(svc)

    await expect(c.getReservations("pending" as any)).resolves.toEqual([{ id: "r1" }])
    expect(svc.getReservations).toHaveBeenCalledWith({ status: "pending" })
  })
})