import { RolesGuard } from "./roles.guard"

describe("RolesGuard", () => {
  it("returns true when no roles metadata", () => {
    const reflector: any = { getAllAndOverride: jest.fn().mockReturnValue(undefined) }
    const guard = new RolesGuard(reflector)

    const ctx: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "user" } }) }),
    }

    expect(guard.canActivate(ctx)).toBe(true)
  })

  it("returns true when role matches", () => {
    const reflector: any = { getAllAndOverride: jest.fn().mockReturnValue(["admin"]) }
    const guard = new RolesGuard(reflector)

    const ctx: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "admin" } }) }),
    }

    expect(guard.canActivate(ctx)).toBe(true)
  })

  it("returns false when role does not match", () => {
    const reflector: any = { getAllAndOverride: jest.fn().mockReturnValue(["admin"]) }
    const guard = new RolesGuard(reflector)

    const ctx: any = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: "user" } }) }),
    }

    expect(guard.canActivate(ctx)).toBe(false)
  })
})