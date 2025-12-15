import { Injectable } from "@nestjs/common"
import { EventEmitter } from "events"
import type { ReservationAnalyticsEvent } from "./analytics.events"

@Injectable()
export class AnalyticsEventBus {
  private readonly ee = new EventEmitter()

  emit(evt: ReservationAnalyticsEvent) {
    this.ee.emit("analytics.event", evt)
  }

  on(handler: (evt: ReservationAnalyticsEvent) => void) {
    this.ee.on("analytics.event", handler)
  }
}