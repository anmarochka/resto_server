import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { JwtStrategy } from "./strategies/jwt.strategy"
import type { SignOptions } from "jsonwebtoken"

const jwtExpiresIn = (): SignOptions["expiresIn"] => {
  const v = process.env.JWT_EXPIRES_IN
  if (!v) return "7d"
  return /^\d+$/.test(v) ? Number(v) : (v as SignOptions["expiresIn"])
}

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_secret",
      signOptions: { expiresIn: jwtExpiresIn() },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
