import { Injectable } from "@nestjs/common"
import { RedisService } from "../redis/redis.service"
import { WsGateway } from "../ws/ws.gateway"
import { RestaurantsRepository } from "./restaurants.repository"

type TableStatus = "available" | "occupied"

const tableStatusKey = (restaurantId: string, tableId: string) =>
  `tables:status:${restaurantId}:${tableId}`

@Injectable()
export class ApiRestaurantsService {
  constructor(
    private readonly repo: RestaurantsRepository,
    private readonly redis: RedisService,
    private readonly ws: WsGateway,
  ) {}

  getAll() {
    return this.repo.findAll()
  }

  getById(id: string) {
    return this.repo.findById(id)
  }

  getFloorPlan(restaurantId: string) {
    return this.repo.getFloorPlan(restaurantId)
  }

  async getTables(restaurantId: string) {
    const tables = await this.repo.findTablesByRestaurant(restaurantId)
    const r = this.redis.raw()
    const keys = tables.map((t) => tableStatusKey(restaurantId, t.id))
    const statuses = keys.length ? await r.mget(...keys) : []

    return tables.map((t, i) => ({
      id: t.id,
      hallId: t.hall_id,
      hallName: t.halls?.name ?? null,
      tableNumber: t.table_number,
      seats: t.seats,
      positionIndex: t.position_index,
      status: (statuses[i] as TableStatus | null) ?? "available",
    }))
  }

  async updateTableStatus(restaurantId: string, tableId: string, status: TableStatus) {
    const r = this.redis.raw()
    const key = tableStatusKey(restaurantId, tableId)
    const oldStatus = ((await r.get(key)) as TableStatus | null) ?? "available"

    await r.set(key, status)

    const data = { restaurantId, tableId, oldStatus, newStatus: status }

    this.ws.emitToRestaurant(restaurantId, {
      type: "table_status_changed",
      data,
    })

    return data
  }
}
