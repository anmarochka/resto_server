import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common"

const UUID_LOOSE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

@Injectable()
export class ParseUuidLoosePipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (typeof value !== "string" || !UUID_LOOSE_REGEX.test(value)) {
      throw new BadRequestException("Validation failed (UUID format is expected)")
    }
    return value
  }
}