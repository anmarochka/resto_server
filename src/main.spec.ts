describe("main.ts", () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.NODE_ENV = "test"
  })

  it("exports bootstrap in test env (does not auto-listen)", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("./main") as typeof import("./main")
      expect(typeof mod.bootstrap).toBe("function")
    })
  })
})