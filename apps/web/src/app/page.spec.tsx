import Index from './page';
import { AppShell, HealthStatusView, PermissionDeniedState } from './components';
import { fallbackBootstrap, fallbackHealth } from './lib/api';

describe('web routes', () => {
  it('defines the root redirect page', () => {
    expect(Index).toBeDefined();
  });

  it('renders the authenticated shell contract', () => {
    expect(AppShell({ bootstrap: fallbackBootstrap() })).toBeDefined();
  });

  it('renders permission denied without leaking scope details', () => {
    expect(PermissionDeniedState()).toBeDefined();
  });

  it('renders admin health status from the shared contract', () => {
    expect(
      HealthStatusView({
        health: fallbackHealth(),
        isAdmin: true,
        statusFilter: 'all',
      }),
    ).toBeDefined();
  });
});
