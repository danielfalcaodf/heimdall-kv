import type { HealthDependency } from '@heimdall/contracts';

export interface IHealthChecker {
  check(checkedAt: string): Promise<HealthDependency>;
}

export const HEALTH_CHECKERS = Symbol('HEALTH_CHECKERS');
