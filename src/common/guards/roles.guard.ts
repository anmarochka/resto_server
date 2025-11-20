import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { ROLES_KEY } from "../decorators/roles.decorator"
import type { AppRole } from "../constants/roles.constants"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!roles || roles.length === 0) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user as { role?: AppRole } | undefined

    return !!user?.role && roles.includes(user.role)
  }
}
