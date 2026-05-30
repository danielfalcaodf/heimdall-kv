import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { ProjectRoleGuard } from './project-role.guard';
import { UserBindingRepository } from '../../org/repositories/user-binding.repository';

function makeBinding(
  userId: string,
  role: 'viewer' | 'editor' | 'admin',
  projectId?: string,
  hasVaultAccess = false,
) {
  return { id: 'b1', userId, role, projectId, hasVaultAccess, createdAt: new Date() } as ReturnType<
    UserBindingRepository['findByUser']
  >[0];
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

describe('ProjectRoleGuard', () => {
  let reflector: Reflector;
  let bindingRepo: jest.Mocked<UserBindingRepository>;
  let guard: ProjectRoleGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    bindingRepo = { findByUser: jest.fn() } as unknown as jest.Mocked<UserBindingRepository>;
    guard = new ProjectRoleGuard(reflector, bindingRepo);
  });

  it('permite quando não há roles requeridos na rota', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(guard.canActivate(makeContext('u1') as any)).toBe(true);
  });

  it('lança ForbiddenException quando usuário não está autenticado', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['viewer']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext(undefined) as any)).toThrow(ForbiddenException);
  });

  it('permite acesso com papel correto no projeto', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['editor']);
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', 'editor', 'proj-A')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(guard.canActivate(makeContext('u1', 'proj-A') as any)).toBe(true);
  });

  it('nega acesso com papel insuficiente', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', 'editor', 'proj-A')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext('u1', 'proj-A') as any)).toThrow(ForbiddenException);
  });

  it('nega acesso quando vínculo é para projeto diferente', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['editor']);
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', 'editor', 'proj-B')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext('u1', 'proj-A') as any)).toThrow(ForbiddenException);
  });

  it('permite quando usuário sem vinculo acessa rota sem projeto específico e tem papel', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    bindingRepo.findByUser.mockReturnValue([makeBinding('u1', 'admin')]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(guard.canActivate(makeContext('u1', undefined) as any)).toBe(true);
  });

  it('nega quando usuário sem vínculos tenta acessar recurso protegido', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['viewer']);
    bindingRepo.findByUser.mockReturnValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => guard.canActivate(makeContext('u1', 'proj-A') as any)).toThrow(ForbiddenException);
  });
});
