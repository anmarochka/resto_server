import { Body, Controller, Post } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { TelegramAuthDto } from "./dto/telegram-auth.dto"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Authenticate user via Telegram WebApp initData" })
  @Post("telegram")
  telegram(@Body() dto: TelegramAuthDto) {
    return this.authService.authenticateTelegram(dto.initData)
  }
}
