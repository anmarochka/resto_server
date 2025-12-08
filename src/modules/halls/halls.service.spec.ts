import { HallsService } from "./halls.service"

describe("HallsService", () => {
  it("getByRestaurant delegates to repo", async () => {
    const repo: any = { findByRestaurant: jest.fn().mockResolvedValue([{ id: "h1" }]) }
    const s = new HallsService(repo)

    await expect(s.getByRestaurant("rest-1")).resolves.toEqual([{ id: "h1" }])
    expect(repo.findByRestaurant).toHaveBeenCalledWith("rest-1")
  })
})