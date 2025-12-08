import { AuthController } from "./auth.controller"

describe("AuthController", () => {
  it("telegram delegates to authService", async () => {
    const svc: any = { authenticateTelegram: jest.fn().mockResolvedValue({ accessToken: "t" }) }
    const c = new AuthController(svc)

    await expect(c.telegram({ initData: "init" } as any)).resolves.toEqual({ accessToken: "t" })
    expect(svc.authenticateTelegram).toHaveBeenCalledWith("init")
  })
})