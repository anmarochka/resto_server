import { UsersController } from "./users.controller"

describe("UsersController", () => {
  it("me returns profile for req.user.userId", async () => {
    const svc: any = { getProfile: jest.fn().mockResolvedValue({ id: "u1" }) }
    const c = new UsersController(svc)

    await expect(c.me({ user: { userId: "u1" } } as any)).resolves.toEqual({ id: "u1" })
    expect(svc.getProfile).toHaveBeenCalledWith("u1")
  })
})