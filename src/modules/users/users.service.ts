import { Injectable } from "@nestjs/common"
import { UsersRepository } from "./users.repository"

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  getProfile(userId: string) {
    return this.usersRepo.findById(userId)
  }
}
