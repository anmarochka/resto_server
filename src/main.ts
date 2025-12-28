import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { CorrelationIdInterceptor } from "./common/interceptors/correlation-id.interceptor"

export async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableShutdownHooks()
  const localOrigins = [
    "http://localhost:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
  ]
  const envOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
  const allowAll = process.env.CORS_ALLOW_ALL === "true"
  const origins = envOrigins && envOrigins.length > 0 ? envOrigins : localOrigins

  app.enableCors({
    origin: allowAll
      ? true
      : (origin, callback) => {
          if (!origin) return callback(null, true)
          if (origins.includes(origin)) return callback(null, true)
          return callback(new Error(`CORS blocked: ${origin}`), false)
        },
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new CorrelationIdInterceptor())

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Hanna API")
    .setDescription("API documentation")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup("api/docs", app, document)

  await app.listen(process.env.PORT || 3000)
}

if (process.env.NODE_ENV !== "test") {
  void bootstrap()
}
