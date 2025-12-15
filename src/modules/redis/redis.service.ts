import { Injectable, OnModuleDestroy } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Redis from "ioredis"

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis

  constructor(cfg: ConfigService) {
    const url = cfg.get<string>("REDIS_URL") ?? "redis://localhost:6379"
    const isTest = (cfg.get<string>("NODE_ENV") ?? process.env.NODE_ENV) === "test"

    this.client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      // IMPORTANT: tests/e2e не должны держать сокет Redis
      lazyConnect: isTest,
      enableOfflineQueue: !isTest,
    })
  }

  raw() {
    return this.client
  }

  async onModuleDestroy() {
    try {
      // quit может зависнуть, если соединение не установлено/не ready
      if ((this.client as any).status === "ready") {
        await this.client.quit()
      } else {
        this.client.disconnect()
      }
    } catch {
      this.client.disconnect()
    }
  }
}