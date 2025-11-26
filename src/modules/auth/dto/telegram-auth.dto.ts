import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class TelegramAuthDto {
  @ApiProperty({ description: "Telegram WebApp initData" })
  @IsString()
  @IsNotEmpty()
  initData: string
}
