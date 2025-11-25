// analytics.gateway.ts
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { Server } from "socket.io"

@WebSocketGateway()
export class AnalyticsGateway {
  @WebSocketServer()
  server: Server

  emitUpdate(data: any) {
    this.server.emit("analytics:update", data)
  }
}
