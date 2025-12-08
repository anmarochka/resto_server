import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common"
import { HttpExceptionFilter } from "./http-exception.filter"

describe("HttpExceptionFilter", () => {
  it("formats HttpException response", () => {
    const filter = new HttpExceptionFilter()

    const json = jest.fn()
    const status = jest.fn().mockReturnValue({ json })

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: "/x" }),
      }),
    } as unknown as ArgumentsHost

    filter.catch(new HttpException("Bad", HttpStatus.BAD_REQUEST), host)

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: "/x",
      })
    )
  })
})