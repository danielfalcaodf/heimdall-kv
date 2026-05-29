import { Injectable } from '@nestjs/common';
import type { BootstrapResponse, HealthResponse } from '@heimdall/contracts';
import { DependencyHealthService } from './dependency-health.service';

@Injectable()
export class AppService {
  constructor(private readonly dependencyHealth: DependencyHealthService) {}

  getData(): { message: string } {
    return { message: 'Heimdall KV API operacional' };
  }

  getBootstrap(now = new Date()): BootstrapResponse {
    return {
      checkedAt: now.toISOString(),
      user: {
        id: 'demo-admin',
        displayName: 'Administrador demo',
        role: 'administrator',
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
          allowed: false,
          requiredRole: 'vault',
        },
        {
          id: 'ai',
          label: 'IA contextual',
          href: '/app',
          status: 'unknown',
          allowed: true,
        },
        {
          id: 'admin-status',
          label: 'Status operacional',
          href: '/admin/status',
          status: 'operational',
          allowed: true,
          requiredRole: 'administrator',
        },
      ],
      worker: {
        status: 'operational',
        queueName: 'system.health.sanity',
      },
    };
  }

  getHealth(): Promise<HealthResponse> {
    return this.dependencyHealth.getHealth();
  }
}
