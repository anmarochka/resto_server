import { Injectable } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"
import { CreateReservationDto } from "./dto/create-reservation.dto"
import { AnalyticsGateway } from "../analytics/analytics.gateway"

@Injectable()
export class ReservationsService {
  constructor(
    private readonly repo: ReservationsRepository,
    private readonly analyticsGateway: AnalyticsGateway
  ) {}

  async createReservation(dto: CreateReservationDto) {
    const reservation = await this.repo.createActive(dto.hallId)
    this.analyticsGateway.emitReservationCreated(reservation)
    return reservation
  }

  async cancelReservation(id: string, reason: string) {
    const reservation = await this.repo.cancel(id, reason)
    this.analyticsGateway.emitReservationCancelled(reservation)
    return reservation
  }
}
