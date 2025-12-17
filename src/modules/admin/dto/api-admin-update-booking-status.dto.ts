import { ApiProperty } from "@nestjs/swagger"
import { IsIn } from "class-validator"

export class ApiAdminUpdateBookingStatusDto {
  @ApiProperty({ enum: ["pending", "confirmed", "cancelled", "completed"] })
  @IsIn(["pending", "confirmed", "cancelled", "completed"])
  status: "pending" | "confirmed" | "cancelled" | "completed"
}
