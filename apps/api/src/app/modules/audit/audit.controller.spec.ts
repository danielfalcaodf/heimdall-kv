import { AuditController } from './audit.controller';
import { AuditEventRepository } from './audit-event.repository';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let service: AuditService;
  let controller: AuditController;

  beforeEach(() => {
    service = new AuditService(new AuditEventRepository());
    controller = new AuditController(service);
  });

  it('lista eventos de auditoria sem expor campos sensíveis', () => {
    service.record({
      actorUserId: 'u1',
      action: 'login',
      resourceType: 'session',
      result: 'success',
    });

    const events = controller.listEvents();
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events)).not.toMatch(/password|secret|token/i);
  });

  it('filtra eventos por ator quando informado', () => {
    service.record({ actorUserId: 'u1', action: 'login', resourceType: 'session', result: 'success' });
    service.record({ actorUserId: 'u2', action: 'login', resourceType: 'session', result: 'denied' });

    expect(controller.listEvents('u1')).toHaveLength(1);
    expect(controller.listEvents('u1')[0].actorUserId).toBe('u1');
  });
});
