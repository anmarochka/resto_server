import { UsersService } from "./users.service"

describe("UsersService", () => {
  it("getProfile delegates to repo", async () => {
    const repo: any = { findById: jest.fn().mockResolvedValue({ id: "u1" }) }
    const s = new UsersService(repo)

    await expect(s.getProfile("u1")).resolves.toEqual({ id: "u1" })
    expect(repo.findById).toHaveBeenCalledWith("u1")
  })
})