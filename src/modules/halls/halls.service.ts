import { Injectable } from "@nestjs/common"
import { HallsRepository } from "./halls.repository"

@Injectable()
export class HallsService {
  constructor(private readonly repo: HallsRepository) {}

  getByRestaurant(restaurantId: string) {
    return this.repo.findByRestaurant(restaurantId)
  }
}