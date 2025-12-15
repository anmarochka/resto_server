import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool?: Pool

  constructor(config: ConfigService) {
    const nodeEnv = config.get<string>("NODE_ENV") ?? process.env.NODE_ENV

    if (nodeEnv === "test") {
      const url = config.getOrThrow<string>("DATABASE_URL")
      // тип PrismaClientOptions в сгенерированном клиенте не содержит datasources, кастуем
      super({ datasources: { db: { url } } } as any)
      return
    }

    const accelerateUrl = config.get<string>("PRISMA_ACCELERATE_URL")

    if (nodeEnv === "production" && accelerateUrl) {
      super({ accelerateUrl })
      return
    }

    const databaseUrl = config.getOrThrow<string>("DATABASE_URL")
    const pool = new Pool({ connectionString: databaseUrl })
    super({ adapter: new PrismaPg(pool) })
    this.pool = pool
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === "test") return
    await this.$connect()
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === "test") return
    await this.$disconnect()
    await this.pool?.end()
  }
}
