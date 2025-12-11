import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, Matches } from "class-validator"

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID("4")
  restaurantId: string

  @ApiProperty()
  @IsUUID("4")
  hallId: string

  @ApiProperty()
  @IsUUID("4")
  tableId: string

  @ApiProperty({ example: "2025-12-05" })
  @IsString()
  @IsNotEmpty()
  // YYYY-MM-DD
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string

  @ApiProperty({ example: "19:00" })
  @IsString()
  @IsNotEmpty()
  // HH:MM
  @Matches(/^\d{2}:\d{2}$/)
  timeFrom: string

  @ApiProperty({ example: "21:00" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  timeTo: string

  @ApiProperty()
  @IsInt()
  @Min(1)
  guestsCount: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guestName?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  guestPhone?: string
}