import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@heimdall/contracts';
import { HealthService } from './modules/health/health.service';

/** Thin adapter: mantém compatibilidade com AppService enquanto delega ao HealthService modular. */
@Injectable()
export class DependencyHealthService {
  constructor(private readonly healthService: HealthService) {}

  getHealth(now = new Date()): Promise<HealthResponse> {
    return this.healthService.getHealth(now);
  }
}
