import { RestaurantsService } from "./restaurants.service"

function pickFn(obj: any, names: string[]) {
  for (const n of names) if (typeof obj?.[n] === "function") return obj[n].bind(obj)
  throw new Error(`None of methods found: ${names.join(", ")}`)
}

describe("RestaurantsService", () => {
  it("delegates to repository", async () => {
    const repo: any = {
      findAll: jest.fn().mockResolvedValue([{ id: "r1" }]),
      findMany: jest.fn().mockResolvedValue([{ id: "r1" }]),
      getAll: jest.fn().mockResolvedValue([{ id: "r1" }]),
    }
    const s = new RestaurantsService(repo)

    const fn = pickFn(s as any, ["getAll", "findAll", "list", "all"])
    await expect(fn()).resolves.toEqual([{ id: "r1" }])
  })
})