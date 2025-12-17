import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator"

const UUID_LOOSE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class ApiAdminCreateBookingDto {
  @ApiProperty()
  @Matches(UUID_LOOSE_REGEX)
  hallId: string

  @ApiProperty()
  @Matches(UUID_LOOSE_REGEX)
  tableId: string

  @ApiProperty({ example: "2025-12-05" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string

  @ApiProperty({ example: "19:00" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  timeFrom: string

  @ApiProperty({ example: "21:00" })
  @IsString()
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  guestPhone: string
}
