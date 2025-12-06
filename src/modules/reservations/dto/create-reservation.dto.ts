import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsUUID } from "class-validator"

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUUID("4")
  hallId: string
}