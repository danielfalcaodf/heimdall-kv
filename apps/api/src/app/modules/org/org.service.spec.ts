import { OrgService, OrgError } from './org.service';

describe('OrgService', () => {
  let service: OrgService;
  const now = new Date('2026-05-31T10:00:00.000Z');

  beforeEach(() => {
    service = new OrgService();
  });

  // --- Clients ---

  describe('clients', () => {
    it('creates a client and lists it', () => {
      const client = service.createClient({ name: 'Acme Corp' }, now);
      expect(client.name).toBe('Acme Corp');
      expect(client.status).toBe('active');

      const list = service.listClients();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(client.id);
    });

    it('trims client name on creation', () => {
      const client = service.createClient({ name: '  Trimmed  ' }, now);
      expect(client.name).toBe('Trimmed');
    });

    it('rejects blank client name', () => {
      expect(() => service.createClient({ name: '   ' }, now)).toThrow(OrgError);
    });

    it('archives a client and hides it from default listing', () => {
      const client = service.createClient({ name: 'Old Client' }, now);
      service.archiveClient(client.id, now);

      const active = service.listClients();
      expect(active).toHaveLength(0);

      const withArchived = service.listClients({ includeArchived: true });
      expect(withArchived[0].status).toBe('archived');
    });

    it('throws when archiving non-existent client', () => {
      expect(() => service.archiveClient('non-existent-id', now)).toThrow(OrgError);
    });
  });

  // --- Sectors ---

  describe('sectors', () => {
    it('creates a sector bound to a client', () => {
      const client = service.createClient({ name: 'Acme' }, now);
      const sector = service.createSector({ clientId: client.id, name: 'Finance' }, now);
      expect(sector.clientId).toBe(client.id);
      expect(sector.status).toBe('active');
    });

    it('rejects sector for non-existent client', () => {
      expect(() =>
        service.createSector({ clientId: 'missing-client', name: 'IT' }, now),
      ).toThrow(OrgError);
    });

    it('rejects sector for archived client', () => {
      const client = service.createClient({ name: 'Archived Inc' }, now);
      service.archiveClient(client.id, now);
      expect(() =>
        service.createSector({ clientId: client.id, name: 'HR' }, now),
      ).toThrow(OrgError);
    });

    it('lists sectors and filters by client', () => {
      const c1 = service.createClient({ name: 'C1' }, now);
      const c2 = service.createClient({ name: 'C2' }, now);
      service.createSector({ clientId: c1.id, name: 'S1' }, now);
      service.createSector({ clientId: c2.id, name: 'S2' }, now);

      const c1Sectors = service.listSectors({ clientId: c1.id });
      expect(c1Sectors).toHaveLength(1);
      expect(c1Sectors[0].name).toBe('S1');
    });

    it('archives a sector', () => {
      const client = service.createClient({ name: 'Acme' }, now);
      const sector = service.createSector({ clientId: client.id, name: 'Legal' }, now);
      service.archiveSector(sector.id, now);

      expect(service.listSectors({ clientId: client.id })).toHaveLength(0);
    });
  });

  // --- Projects ---

  describe('projects', () => {
    it('creates a project bound to a client', () => {
      const client = service.createClient({ name: 'Acme' }, now);
      const project = service.createProject({ clientId: client.id, name: 'Portal' }, now);
      expect(project.clientId).toBe(client.id);
      expect(project.sectorId).toBeUndefined();
      expect(project.status).toBe('active');
    });

    it('creates a project bound to client and sector', () => {
      const client = service.createClient({ name: 'Acme' }, now);
      const sector = service.createSector({ clientId: client.id, name: 'IT' }, now);
      const project = service.createProject(
        { clientId: client.id, sectorId: sector.id, name: 'ERP' },
        now,
      );
      expect(project.sectorId).toBe(sector.id);
    });

    it('rejects project for archived client', () => {
      const client = service.createClient({ name: 'Old' }, now);
      service.archiveClient(client.id, now);
      expect(() =>
        service.createProject({ clientId: client.id, name: 'X' }, now),
      ).toThrow(OrgError);
    });

    it('rejects project when sector does not belong to client', () => {
      const c1 = service.createClient({ name: 'C1' }, now);
      const c2 = service.createClient({ name: 'C2' }, now);
      const sector = service.createSector({ clientId: c2.id, name: 'S' }, now);
      expect(() =>
        service.createProject({ clientId: c1.id, sectorId: sector.id, name: 'P' }, now),
      ).toThrow(OrgError);
    });

    it('archives a project and hides it from default listing', () => {
      const client = service.createClient({ name: 'Acme' }, now);
      const project = service.createProject({ clientId: client.id, name: 'Proj' }, now);
      service.archiveProject(project.id, now);
      expect(service.listProjects({ clientId: client.id })).toHaveLength(0);
    });
  });
});
