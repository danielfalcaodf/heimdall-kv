import { AppService } from './app.service';
import type { DependencyHealthService } from './dependency-health.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    const health = {
      getHealth: jest.fn().mockResolvedValue({
        checkedAt: '2026-05-29T00:00:00.000Z',
        status: 'operational',
        dependencies: [],
      }),
    } as unknown as DependencyHealthService;

    service = new AppService(health);
  });

  it('returns the API identity without exposing secrets', () => {
    expect(service.getData()).toEqual({ message: 'Heimdall KV API operacional' });
  });

  it('returns a safe bootstrap contract', () => {
    const bootstrap = service.getBootstrap(new Date('2026-05-29T00:00:00.000Z'));

    expect(bootstrap.user.role).toBe('administrator');
    expect(bootstrap.activeScope.clientId).toBe('cliente-demo');
    expect(bootstrap.modules.some((module) => module.id === 'vault')).toBe(true);
    expect(JSON.stringify(bootstrap)).not.toMatch(/secret|token|password/i);
  });
});
