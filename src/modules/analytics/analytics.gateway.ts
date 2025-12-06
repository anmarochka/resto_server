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

  emitReservationCreated(payload: any) {
    this.server.emit("reservation_created", payload)
    this.emitUpdate({ type: "reservation_created", payload })
  }

  emitReservationCancelled(payload: any) {
    this.server.emit("reservation_cancelled", payload)
    this.emitUpdate({ type: "reservation_cancelled", payload })
  }
}
