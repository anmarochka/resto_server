import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty } from "class-validator"

export class CancelReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string
}