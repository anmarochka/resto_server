import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty } from "class-validator"

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hallId: string
}