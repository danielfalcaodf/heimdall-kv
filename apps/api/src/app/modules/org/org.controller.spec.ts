import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { AuditService } from '../audit/audit.service';

function makeService(): OrgService {
  return new OrgService();
}

function makeAudit(): jest.Mocked<Pick<AuditService, 'record'>> {
  return { record: jest.fn() };
}

function makeController(
  svc?: OrgService,
): [OrgController, ReturnType<typeof makeAudit>] {
  const audit = makeAudit();
  return [new OrgController(svc ?? makeService(), audit as unknown as AuditService), audit];
}

describe('OrgController — audit integration', () => {
  it('cria cliente e registra evento de audit', () => {
    const [ctrl, audit] = makeController();
    const result = ctrl.createClient({ name: 'Acme Corp' });
    expect(result.id).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create_client', result: 'success', resourceType: 'client' }),
    );
  });

  it('lança 400 para nome inválido no cliente', () => {
    const [ctrl] = makeController();
    expect(() => ctrl.createClient({ name: '' })).toThrow(BadRequestException);
  });

  it('arquiva cliente e registra evento de audit', () => {
    const svc = makeService();
    const client = svc.createClient({ name: 'Beta Ltd' }, new Date());
    const [ctrl, audit] = makeController(svc);
    const result = ctrl.archiveClient(client.id);
    expect(result.status).toBe('archived');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'archive_client', result: 'success' }),
    );
  });

  it('lança 404 ao arquivar cliente inexistente', () => {
    const [ctrl] = makeController();
    expect(() => ctrl.archiveClient('nonexistent')).toThrow(NotFoundException);
  });

  it('cria setor e registra evento de audit', () => {
    const svc = makeService();
    const client = svc.createClient({ name: 'Gamma SA' }, new Date());
    const [ctrl, audit] = makeController(svc);
    const result = ctrl.createSector({ name: 'TI', clientId: client.id });
    expect(result.id).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create_sector', result: 'success' }),
    );
  });

  it('cria projeto e registra evento de audit', () => {
    const svc = makeService();
    const client = svc.createClient({ name: 'Delta Inc' }, new Date());
    const [ctrl, audit] = makeController(svc);
    const result = ctrl.createProject({ name: 'Portal', clientId: client.id });
    expect(result.id).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create_project', result: 'success' }),
    );
  });

  it('arquiva projeto e registra evento de audit', () => {
    const svc = makeService();
    const client = svc.createClient({ name: 'Epsilon' }, new Date());
    const proj = svc.createProject({ name: 'Alpha', clientId: client.id }, new Date());
    const [ctrl, audit] = makeController(svc);
    const result = ctrl.archiveProject(proj.id);
    expect(result.status).toBe('archived');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'archive_project', result: 'success' }),
    );
  });
});
