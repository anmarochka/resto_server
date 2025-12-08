import { RestaurantsController } from "./restaurants.controller"

function pickFn(obj: any, names: string[]) {
  for (const n of names) if (typeof obj?.[n] === "function") return obj[n].bind(obj)
  throw new Error(`None of methods found: ${names.join(", ")}`)
}

describe("RestaurantsController", () => {
  it("GET handler delegates to service", async () => {
    const svc: any = {
      getAll: jest.fn().mockResolvedValue([{ id: "r1" }]),
      findAll: jest.fn().mockResolvedValue([{ id: "r1" }]),
      list: jest.fn().mockResolvedValue([{ id: "r1" }]),
    }

    const c = new RestaurantsController(svc)
    const fn = pickFn(c as any, ["getAll", "findAll", "list", "all"])

    await expect(fn()).resolves.toEqual([{ id: "r1" }])
  })
})