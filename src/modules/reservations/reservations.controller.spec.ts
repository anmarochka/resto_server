import { ReservationsController } from "./reservations.controller"

describe("ReservationsController", () => {
  it("create delegates to service with req.user.userId", async () => {
    const svc: any = { createReservation: jest.fn().mockResolvedValue({ id: "r1" }) }
    const c = new ReservationsController(svc)

    const dto: any = { hallId: "h1" }
    const req: any = { user: { userId: "u1" } }

    await expect(c.create(dto, req)).resolves.toEqual({ id: "r1" })
    expect(svc.createReservation).toHaveBeenCalledWith(dto, "u1")
  })

  it("cancel delegates to service", async () => {
    const svc: any = {
      cancelReservation: jest.fn().mockResolvedValue({ id: "r1", status: "cancelled" }),
    }
    const c = new ReservationsController(svc)

    await expect(
      c.cancel("00000000-0000-4000-8000-000000000000", { reason: "x" } as any)
    ).resolves.toEqual({
      id: "r1",
      status: "cancelled",
    })
    expect(svc.cancelReservation).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000000",
      "x"
    )
  })
})