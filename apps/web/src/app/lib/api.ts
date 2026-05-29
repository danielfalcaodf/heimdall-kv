import type { BootstrapResponse, HealthResponse, UserRole } from '@heimdall/contracts';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function getDemoRole(): UserRole {
  const value = process.env.NEXT_PUBLIC_DEMO_ROLE;
  if (value === 'viewer' || value === 'editor' || value === 'vault') {
    return value;
  }

  return 'administrator';
}

export function fallbackBootstrap(now = new Date()): BootstrapResponse {
  const role = getDemoRole();

  return {
    checkedAt: now.toISOString(),
    user: {
      id: 'demo-user',
      displayName: 'Usuario demo',
      role,
    },
    activeScope: {
      clientId: 'cliente-demo',
      clientName: 'Cliente demo',
      projectId: 'projeto-base',
      projectName: 'Projeto base',
    },
    modules: [
      {
        id: 'documents',
        label: 'Documentos',
        href: '/app',
        status: 'operational',
        allowed: true,
      },
      {
        id: 'search',
        label: 'Busca',
        href: '/app',
        status: 'unknown',
        allowed: true,
      },
      {
        id: 'vault',
        label: 'Vault',
        href: '/app/sem-acesso',
        status: 'unknown',
        allowed: role === 'vault' || role === 'administrator',
        requiredRole: 'vault',
      },
      {
        id: 'admin-status',
        label: 'Status operacional',
        href: '/admin/status',
        status: 'degraded',
        allowed: role === 'administrator',
        requiredRole: 'administrator',
      },
    ],
    worker: {
      status: 'unknown',
      queueName: 'system.health.sanity',
    },
  };
}

export function fallbackHealth(now = new Date()): HealthResponse {
  const checkedAt = now.toISOString();

  return {
    checkedAt,
    status: 'unknown',
    dependencies: [
      {
        id: 'api',
        label: 'API',
        status: 'unknown',
        checkedAt,
        message: 'A API ainda nao respondeu neste ambiente.',
      },
      {
        id: 'database',
        label: 'PostgreSQL',
        status: 'unknown',
        checkedAt,
        message: 'Status aguardando endpoint de health.',
      },
      {
        id: 'redis',
        label: 'Redis',
        status: 'unknown',
        checkedAt,
        message: 'Status aguardando endpoint de health.',
      },
      {
        id: 'worker',
        label: 'Worker',
        status: 'unknown',
        checkedAt,
        message: 'Status aguardando endpoint de health.',
      },
      {
        id: 'storage',
        label: 'Storage privado',
        status: 'unknown',
        checkedAt,
        message: 'Status aguardando endpoint de health.',
      },
      {
        id: 'jobs',
        label: 'Fila BullMQ',
        status: 'unknown',
        checkedAt,
        message: 'Status aguardando endpoint de health.',
      },
    ],
  };
}

export async function getBootstrap(): Promise<BootstrapResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/bootstrap`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackBootstrap();
    }

    return response.json();
  } catch {
    return fallbackBootstrap();
  }
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackHealth();
    }

    return response.json();
  } catch {
    return fallbackHealth();
  }
}
