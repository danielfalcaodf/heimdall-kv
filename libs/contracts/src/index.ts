export const domainSchemas = [
  'auth',
  'org',
  'kb',
  'storage',
  'vault',
  'search',
  'ai',
  'audit',
  'admin',
] as const;

export type DomainSchema = (typeof domainSchemas)[number];

export type OperationalStatus = 'operational' | 'degraded' | 'unavailable' | 'unknown';

export type UserRole = 'viewer' | 'editor' | 'administrator' | 'vault';

export interface ActiveScope {
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
}

export interface BootstrapUser {
  id: string;
  displayName: string;
  role: UserRole;
}

export interface BootstrapModule {
  id: string;
  label: string;
  href: string;
  status: OperationalStatus;
  allowed: boolean;
  requiredRole?: UserRole;
}

export interface BootstrapResponse {
  checkedAt: string;
  user: BootstrapUser;
  activeScope: ActiveScope;
  modules: BootstrapModule[];
  worker: {
    status: OperationalStatus;
    queueName: string;
  };
}

export type DependencyId = 'api' | 'database' | 'redis' | 'worker' | 'storage' | 'jobs';

export interface HealthDependency {
  id: DependencyId;
  label: string;
  status: OperationalStatus;
  checkedAt: string;
  message: string;
}

export interface HealthResponse {
  status: OperationalStatus;
  checkedAt: string;
  dependencies: HealthDependency[];
}

const statusRank: Record<OperationalStatus, number> = {
  operational: 0,
  unknown: 1,
  degraded: 2,
  unavailable: 3,
};

export function aggregateOperationalStatus(statuses: OperationalStatus[]): OperationalStatus {
  if (statuses.length === 0) {
    return 'unknown';
  }

  return statuses.reduce((current, next) =>
    statusRank[next] > statusRank[current] ? next : current,
  );
}
