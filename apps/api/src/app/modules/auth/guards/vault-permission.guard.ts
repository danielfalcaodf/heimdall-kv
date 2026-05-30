import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserBindingRepository } from '../../org/repositories/user-binding.repository';
import type { AuthenticatedRequest } from './project-role.guard';

@Injectable()
export class VaultPermissionGuard implements CanActivate {
  constructor(private readonly bindingRepo: UserBindingRepository) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Autenticação requerida.');
    }

    const projectId = request.params?.projectId;

    const bindings = this.bindingRepo.findByUser(userId);
    const hasVaultAccess = bindings.some(
      (b) =>
        b.hasVaultAccess &&
        (projectId === undefined || b.projectId === projectId),
    );

    if (!hasVaultAccess) {
      throw new ForbiddenException('Acesso ao vault não autorizado para este projeto.');
    }

    return true;
  }
}
