import { ForbiddenException, Injectable } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { AnalyticsEventBus } from "../analytics/analytics.event-bus"
import { ROLES } from "../../common/constants/roles.constants"

function toHHMM(d: Date) {
  return d.toISOString().slice(11, 16)
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly repo: ReservationsRepository,
    private readonly bus: AnalyticsEventBus,
  ) {}

  listByUser(userId: string) {
    return this.repo.listByUser(userId)
  }

  async getByIdForCaller(id: string, callerUserId: string, callerRole: string) {
    const reservation = await this.repo.findById(id)
    if (callerRole !== ROLES.ADMIN && reservation.user_id !== callerUserId) {
      throw new ForbiddenException("Access denied")
    }
    return reservation
  }

  async createReservation(dto: CreateReservationDto, userId: string) {
    const reservation = await this.repo.create(dto, userId)

    this.bus.emit({
      event: "reservation.created",
      reservationId: reservation.id,
      restaurantId: reservation.restaurant_id,
      hallId: reservation.hall_id,
      tableId: reservation.table_id,
      guests: reservation.guests_count,
      date: reservation.date.toISOString().slice(0, 10),
      timeFrom: toHHMM(reservation.time_from),
      timeTo: toHHMM(reservation.time_to),
      timestamp: new Date().toISOString(),
      status: reservation.status as any,
    })

    return reservation
  }

  async cancelReservation(id: string, reason: string) {
    const reservation = await this.repo.cancel(id, reason)

    this.bus.emit({
      event: "reservation.cancelled",
      reservationId: reservation.id,
      restaurantId: reservation.restaurant_id,
      hallId: reservation.hall_id,
      tableId: reservation.table_id,
      guests: reservation.guests_count,
      date: reservation.date.toISOString().slice(0, 10),
      timeFrom: toHHMM(reservation.time_from),
      timeTo: toHHMM(reservation.time_to),
      timestamp: new Date().toISOString(),
      status: reservation.status as any,
    })

    return reservation
  }
}
