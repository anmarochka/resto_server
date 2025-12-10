jest.mock("@prisma/client", () => ({
  PrismaClient: class {
    public $connect = jest.fn()
    public $disconnect = jest.fn()
    constructor(public readonly __opts: any) {}
  },
}))

jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({ end: jest.fn() })),
}))

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn().mockImplementation((pool: any) => ({ pool })),
}))

import { PrismaService } from "./prisma.service"

describe("PrismaService", () => {
  it("uses accelerateUrl when NODE_ENV=production and PRISMA_ACCELERATE_URL is set", () => {
    const cfg: any = {
      get: jest.fn((k: string) => {
        if (k === "NODE_ENV") return "production"
        if (k === "PRISMA_ACCELERATE_URL") return "prisma+postgres://x"
        return undefined
      }),
      getOrThrow: jest.fn(),
    }

    const s = new PrismaService(cfg)
    expect((s as any).__opts).toEqual({ accelerateUrl: "prisma+postgres://x" })
  })

  it("uses adapter when not production (or no accelerate url)", () => {
    const cfg: any = {
      get: jest.fn((k: string) => (k === "NODE_ENV" ? "development" : undefined)),
      getOrThrow: jest.fn(() => "postgresql://localhost/db"),
    }

    const s = new PrismaService(cfg)
    expect((s as any).__opts).toHaveProperty("adapter")
  })
})