import { ForbiddenException } from '@nestjs/common';
import { VaultPermissionGuard } from './vault-permission.guard';
import { UserBindingRepository } from '../../org/repositories/user-binding.repository';

function makeBinding(
  userId: string,
  hasVaultAccess: boolean,
  projectId?: string,
) {
  return {
    id: 'b1',
    userId,
    role: 'viewer' as const,
    hasVaultAccess,
    projectId,
    createdAt: new Date(),
  };
}

function makeContext(userId?: string, projectId?: string) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userId ? { id: userId } : undefined,
        params: { projectId },
      }),
    }),
  };
}

describe('VaultPermissionGuard', () => {
  let bindingRepo: jest.Mocked<UserBindingRepository>;
  let guard: VaultPermissionGuard;

  beforeEach(() => {
    bindingRepo = { findByUser: jest.fn() } as unknown as jest.Mocked<UserBindingRepository>;
    guard = new VaultPermissionGuard(bindingRepo);
  });

  it('lança ForbiddenException quando usuário não está autenticado', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext(undefined) as any)).toThrow(ForbiddenException);
  });

  it('permite acesso quando usuário tem hasVaultAccess=true no projeto', () => {
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', true, 'proj-A')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(guard.canActivate(makeContext('u1', 'proj-A') as any)).toBe(true);
  });

  it('nega acesso quando admin não tem hasVaultAccess explícito', () => {
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', false, 'proj-A')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext('u1', 'proj-A') as any)).toThrow(ForbiddenException);
  });

  it('nega acesso quando hasVaultAccess é true mas para outro projeto', () => {
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', true, 'proj-B')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext('u1', 'proj-A') as any)).toThrow(ForbiddenException);
  });

  it('permite quando não há projectId e usuário tem hasVaultAccess global', () => {
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', true)]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(guard.canActivate(makeContext('u1', undefined) as any)).toBe(true);
  });

  it('nega quando usuário não tem vínculos', () => {
    bindingRepo.findByUser.mockReturnValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext('u1', 'proj-A') as any)).toThrow(ForbiddenException);
  });
});
