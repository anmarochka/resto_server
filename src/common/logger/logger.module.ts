import { Module } from "@nestjs/common"
import { LoggerModule } from "nestjs-pino"

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
                },
              }
            : undefined,
      },
    }),
  ],
})
export class AppLoggerModule {}
