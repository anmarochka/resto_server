import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET
    if (process.env.NODE_ENV === "production" && !secret) {
      throw new Error("JWT_SECRET is required in production")
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret ?? "dev_secret",
    })
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      role: payload.role,
      telegramId: payload.telegramId,
    }
  }
}
