import { Logger } from "@nestjs/common"
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"

@WebSocketGateway({ namespace: "/ws" })
export class WsGateway {
  private readonly logger = new Logger(WsGateway.name)

  @WebSocketServer()
  server: Server

  private room(restaurantId: string) {
    return `restaurant:${restaurantId}`
  }

  handleConnection(client: Socket) {
    client.emit("message", {
      type: "connected",
      data: { timestamp: new Date().toISOString() },
    })
  }

  handleDisconnect(client: Socket) {
    try {
      client.emit("message", {
        type: "disconnected",
        data: { timestamp: new Date().toISOString() },
      })
    } catch {
      //
    }
  }

  @SubscribeMessage("message")
  async onMessage(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    if (!payload?.type) return
    const restaurantId = payload?.data?.restaurantId
    if (!restaurantId) return

    if (payload.type === "subscribe_restaurant") {
      await client.join(this.room(restaurantId))
      this.logger.log(`subscribed socket=${client.id} restaurant=${restaurantId}`)
    }

    if (payload.type === "unsubscribe_restaurant") {
      await client.leave(this.room(restaurantId))
      this.logger.log(`unsubscribed socket=${client.id} restaurant=${restaurantId}`)
    }
  }

  emitToRestaurant(restaurantId: string, msg: { type: string; data: any }) {
    const payload = { timestamp: new Date().toISOString(), ...msg }
    this.server.to(this.room(restaurantId)).emit("message", payload)
    this.server.to(this.room(restaurantId)).emit(msg.type, payload)
  }
}