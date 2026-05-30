import { DeletionPolicyService, DeletionPolicyError } from './deletion-policy.service';
import { ClientRepository } from './repositories/client.repository';
import { SectorRepository } from './repositories/sector.repository';
import { ProjectRepository } from './repositories/project.repository';

function setupService() {
  const clientRepo = new ClientRepository();
  const sectorRepo = new SectorRepository();
  const projectRepo = new ProjectRepository();
  const service = new DeletionPolicyService(clientRepo, sectorRepo, projectRepo);

  const now = new Date('2026-01-01T00:00:00Z');
  const client = clientRepo.create('Cliente A', now);
  const sector = sectorRepo.create(client.id, 'Setor 1', now);
  const project = projectRepo.create(client.id, 'Projeto X', now, sector.id);

  return { service, clientRepo, sectorRepo, projectRepo, client, sector, project, now };
}

describe('DeletionPolicyService', () => {
  it('arquiva um cliente como admin', () => {
    const { service, client, now } = setupService();
    const result = service.archive('client', client.id, 'admin', now);
    expect(result.status).toBe('archived');
  });

  it('bloqueia arquivamento por usuário sem papel admin', () => {
    const { service, client, now } = setupService();
    expect(() => service.archive('client', client.id, 'editor', now)).toThrow(DeletionPolicyError);
    expect(() => service.archive('client', client.id, 'viewer', now)).toThrow(DeletionPolicyError);
  });

  it('restaura um cliente arquivado', () => {
    const { service, client, now } = setupService();
    service.archive('client', client.id, 'admin', now);
    const result = service.restore('client', client.id, 'admin');
    expect(result.status).toBe('active');
  });

  it('não restaura entidade que não está arquivada', () => {
    const { service, client } = setupService();
    expect(() => service.restore('client', client.id, 'admin')).toThrow(DeletionPolicyError);
  });

  it('exclui permanentemente apenas após arquivamento', () => {
    const { service, client, now } = setupService();
    service.archive('client', client.id, 'admin', now);
    const result = service.deletePermanently('client', client.id, 'admin', now);
    expect(result.status).toBe('deleted');
  });

  it('bloqueia exclusão permanente de entidade não arquivada', () => {
    const { service, client, now } = setupService();
    expect(() => service.deletePermanently('client', client.id, 'admin', now)).toThrow(DeletionPolicyError);
  });

  it('bloqueia restauração de entidade já excluída permanentemente', () => {
    const { service, client, now } = setupService();
    service.archive('client', client.id, 'admin', now);
    service.deletePermanently('client', client.id, 'admin', now);
    expect(() => service.restore('client', client.id, 'admin')).toThrow(DeletionPolicyError);
  });

  it('arquiva setor como admin', () => {
    const { service, sector, now } = setupService();
    const result = service.archive('sector', sector.id, 'admin', now);
    expect(result.status).toBe('archived');
  });

  it('arquiva projeto como admin', () => {
    const { service, project, now } = setupService();
    const result = service.archive('project', project.id, 'admin', now);
    expect(result.status).toBe('archived');
  });

  it('lança NOT_FOUND para id inexistente', () => {
    const { service, now } = setupService();
    expect(() => service.archive('client', 'id-inexistente', 'admin', now)).toThrow(DeletionPolicyError);
  });

  it('lança ALREADY_DELETED ao tentar arquivar entidade já excluída', () => {
    const { service, client, now } = setupService();
    service.archive('client', client.id, 'admin', now);
    service.deletePermanently('client', client.id, 'admin', now);
    expect(() => service.archive('client', client.id, 'admin', now)).toThrow(DeletionPolicyError);
  });
});
