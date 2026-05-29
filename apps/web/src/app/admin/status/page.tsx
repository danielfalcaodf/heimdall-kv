import { HealthStatusView } from '../../components';
import { getBootstrap, getHealth } from '../../lib/api';
import type { OperationalStatus } from '@heimdall/contracts';

function parseStatusFilter(value: string | undefined): OperationalStatus | 'all' {
  if (
    value === 'operational' ||
    value === 'degraded' ||
    value === 'unavailable' ||
    value === 'unknown'
  ) {
    return value;
  }

  return 'all';
}

export default async function AdminStatusPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const [bootstrap, health] = await Promise.all([getBootstrap(), getHealth()]);
  const params = searchParams ? await searchParams : undefined;

  return (
    <HealthStatusView
      health={health}
      isAdmin={bootstrap.user.role === 'administrator'}
      statusFilter={parseStatusFilter(params?.status)}
    />
  );
}
