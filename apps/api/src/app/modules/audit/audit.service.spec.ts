import { AuditService } from './audit.service';
import { AuditEventRepository } from './audit-event.repository';

describe('AuditService', () => {
  let service: AuditService;
  let repo: AuditEventRepository;

  beforeEach(() => {
    repo = new AuditEventRepository();
    service = new AuditService(repo);
  });

  it('registra um evento básico de auditoria', () => {
    const view = service.record({
      actorUserId: 'u1',
      action: 'login',
      resourceType: 'session',
      result: 'success',
    });

    expect(view.id).toBeDefined();
    expect(view.actorUserId).toBe('u1');
    expect(view.action).toBe('login');
    expect(view.result).toBe('success');
    expect(view.createdAt).toBeDefined();
  });

  it('registra evento de acesso negado', () => {
    const view = service.record({
      actorUserId: 'u2',
      action: 'view_document',
      resourceType: 'document',
      resourceId: 'doc-123',
      result: 'denied',
    });

    expect(view.result).toBe('denied');
    expect(view.resourceId).toBe('doc-123');
  });

  it('registra evento com escopo de projeto', () => {
    const view = service.record({
      actorUserId: 'u1',
      action: 'create_document',
      resourceType: 'document',
      scopeType: 'project',
      scopeId: 'proj-1',
      result: 'success',
    });

    expect(view.scopeType).toBe('project');
    expect(view.scopeId).toBe('proj-1');
  });

  it('não persiste valores sensíveis passados acidentalmente no input', () => {
    const inputWithSensitive = {
      actorUserId: 'u1',
      action: 'authenticate',
      resourceType: 'user',
      result: 'success' as const,
      // simulating accidental injection
      ...(({ password: 'supersecret123' } as unknown) as Record<string, unknown>),
    };

    const view = service.record(inputWithSensitive);
    const raw = JSON.stringify(view);
    expect(raw).not.toContain('supersecret123');
  });

  it('lista eventos por ator', () => {
    service.record({ actorUserId: 'u1', action: 'login', resourceType: 'session', result: 'success' });
    service.record({ actorUserId: 'u2', action: 'login', resourceType: 'session', result: 'success' });
    service.record({ actorUserId: 'u1', action: 'view_document', resourceType: 'document', result: 'success' });

    const events = service.listByActor('u1');
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.actorUserId === 'u1')).toBe(true);
  });

  it('lista todos os eventos em ordem decrescente de criação', () => {
    service.record({ actorUserId: 'u1', action: 'login', resourceType: 'session', result: 'success' });
    service.record({ actorUserId: 'u2', action: 'login', resourceType: 'session', result: 'denied' });

    const all = service.listAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(new Date(all[0].createdAt) >= new Date(all[1].createdAt)).toBe(true);
  });

  it('ipAddress opcional é preservado quando informado', () => {
    const view = service.record({
      actorUserId: 'u1',
      action: 'login',
      resourceType: 'session',
      result: 'success',
      ipAddress: '192.168.1.100',
    });

    expect(view.ipAddress).toBe('192.168.1.100');
  });
});
