import { AdminService } from "./admin.service"

describe("AdminService", () => {
  it("getReservations calls prisma.reservation.findMany", async () => {
    const prismaMock: any = {
      reservation: { findMany: jest.fn().mockResolvedValue([{ id: "r1" }]) },
    }
    const s = new AdminService(prismaMock)

    await expect(s.getReservations({ status: "active" })).resolves.toEqual([{ id: "r1" }])
    expect(prismaMock.reservation.findMany).toHaveBeenCalled()
  })
})