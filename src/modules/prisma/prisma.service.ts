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
    const accelerateUrl = config.get<string>("PRISMA_ACCELERATE_URL")

    if (config.get<string>("NODE_ENV") === "production" && accelerateUrl) {
      super({ accelerateUrl })
      return
    }

    const databaseUrl = config.getOrThrow<string>("DATABASE_URL")
    const pool = new Pool({ connectionString: databaseUrl })
    super({ adapter: new PrismaPg(pool) })
    this.pool = pool
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool?.end()
  }
}
