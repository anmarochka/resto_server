import { Logger } from "@nestjs/common"
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "../prisma/prisma.service"
import { ROLES } from "../../common/constants/roles.constants"

@WebSocketGateway({ namespace: "/analytics" })
export class AnalyticsGateway {
  private readonly logger = new Logger(AnalyticsGateway.name)

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server

  private room(restaurantId: string) {
    return `restaurant:${restaurantId}`
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as any)?.token ??
        (client.handshake.query as any)?.token

      const restaurantId =
        (client.handshake.auth as any)?.restaurantId ??
        (client.handshake.query as any)?.restaurantId

      if (!token || !restaurantId) {
        client.disconnect(true)
        return
      }

      const payload: any = await this.jwt.verifyAsync(token)
      const userId = payload?.sub as string | undefined
      const role = payload?.role as string | undefined

      if (!userId || role !== ROLES.ADMIN) {
        client.disconnect(true)
        return
      }

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { restaurant_id: true },
      })

      if (!user?.restaurant_id || user.restaurant_id !== restaurantId) {
        client.disconnect(true)
        return
      }

      await client.join(this.room(restaurantId))
      this.logger.log(`WS connected: user=${userId} restaurant=${restaurantId}`)
    } catch {
      client.disconnect(true)
    }
  }

  emitToRestaurant(restaurantId: string, event: string, data: any) {
    this.server.to(this.room(restaurantId)).emit(event, data)
  }

  emitUpdate(data: any) {
    this.server.emit("analytics:update", data)
  }

  emitReservationCreated(payload: any) {
    this.server.emit("reservation_created", payload)
    this.emitUpdate({ type: "reservation_created", payload })
  }

  emitReservationCancelled(payload: any) {
    this.server.emit("reservation_cancelled", payload)
    this.emitUpdate({ type: "reservation_cancelled", payload })
  }
}
