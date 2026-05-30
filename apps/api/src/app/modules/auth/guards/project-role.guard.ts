import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { OrgUserRole } from '@heimdall/contracts';
import { UserBindingRepository } from '../../org/repositories/user-binding.repository';
import { REQUIRE_PROJECT_ROLE_KEY } from '../decorators/require-project-role.decorator';

export interface AuthenticatedRequest {
  user?: { id: string };
  params?: { projectId?: string };
  body?: { projectId?: string };
}

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly bindingRepo: UserBindingRepository,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgUserRole[]>(REQUIRE_PROJECT_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Autenticação requerida.');
    }

    const projectId = request.params?.projectId ?? request.body?.projectId;

    const bindings = this.bindingRepo.findByUser(userId);
    const hasRole = bindings.some(
      (b) =>
        requiredRoles.includes(b.role) &&
        (projectId === undefined || b.projectId === projectId),
    );

    if (!hasRole) {
      throw new ForbiddenException('Acesso negado para este projeto ou papel insuficiente.');
    }

    return true;
  }
}
