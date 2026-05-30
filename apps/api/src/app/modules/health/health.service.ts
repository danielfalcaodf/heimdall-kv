import { Inject, Injectable } from '@nestjs/common';
import { aggregateOperationalStatus, type HealthResponse } from '@heimdall/contracts';
import { HEALTH_CHECKERS, type IHealthChecker } from './health-checker.interface';

@Injectable()
export class HealthService {
  constructor(@Inject(HEALTH_CHECKERS) private readonly checkers: IHealthChecker[]) {}

  async getHealth(now = new Date()): Promise<HealthResponse> {
    const checkedAt = now.toISOString();
    const api = {
      id: 'api' as const,
      label: 'API',
      status: 'operational' as const,
      message: 'Servico HTTP respondendo.',
      checkedAt,
    };
    const dependencies = [api, ...(await Promise.all(this.checkers.map((c) => c.check(checkedAt))))];

    return {
      checkedAt,
      status: aggregateOperationalStatus(dependencies.map((d) => d.status)),
      dependencies,
    };
  }
}
