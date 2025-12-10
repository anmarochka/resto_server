jest.mock("passport-jwt", () => ({
  Strategy: class {
    constructor(_: any) {}
  },
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: () => () => null,
  },
}))

jest.mock("@nestjs/passport", () => ({
  PassportStrategy: (Base: any) =>
    class extends Base {
      constructor(...args: any[]) {
        super(...args)
      }
    },
}))

import { JwtStrategy } from "./jwt.strategy"

describe("JwtStrategy", () => {
  it("validate maps payload to request user", async () => {
    const s = new JwtStrategy()

    await expect(
      s.validate({ sub: "u1", role: "user", telegramId: "123" } as any)
    ).resolves.toEqual({
      userId: "u1",
      role: "user",
      telegramId: "123",
    })
  })
})