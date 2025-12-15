import { AdminService } from "./admin.service"

describe("AdminService", () => {
  it("getReservations calls prisma.reservations.findMany", async () => {
    const prismaMock: any = {
      reservations: { findMany: jest.fn().mockResolvedValue([{ id: "r1" }]) },
    }
    const s = new AdminService(prismaMock)

    await expect(s.getReservations({ status: "pending" })).resolves.toEqual([{ id: "r1" }])
    expect(prismaMock.reservations.findMany).toHaveBeenCalled()
  })
})