import { Injectable } from "@nestjs/common"
import { ReservationsRepository } from "./reservations.repository"

@Injectable()
export class ReservationsService {
  constructor(private readonly repo: ReservationsRepository) {}

  createReservation(data: any) {
    // бизнес-логика будет тут
    return this.repo.create(data)
  }

  cancelReservation(id: string, reason: string) {
    return this.repo.cancel(id, reason)
  }
}
