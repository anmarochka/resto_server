import { ApiProperty } from "@nestjs/swagger"
import { IsIn } from "class-validator"

export class UpdateTableStatusDto {
  @ApiProperty({ enum: ["available", "occupied"] })
  @IsIn(["available", "occupied"])
  status: "available" | "occupied"
}
