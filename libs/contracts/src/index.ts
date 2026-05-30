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

export type LocalUserStatus = 'invited' | 'active' | 'suspended' | 'removed';

export type LocalInvitationStatus = 'pending' | 'accepted' | 'expired' | 'invalidated';

export type LocalSessionStatus = 'active' | 'expired' | 'revoked';

export interface LocalUserView {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: LocalUserStatus;
  createdAt: string;
  activatedAt?: string;
}

export interface LocalInvitationView {
  id: string;
  userId: string;
  email: string;
  status: LocalInvitationStatus;
  createdAt: string;
  expiresAt: string;
  invalidatedAt?: string;
  acceptedAt?: string;
}

export interface CreateLocalInvitationResponse {
  invitation: LocalInvitationView;
  delivery: {
    mode: 'manual';
    invitePath: string;
    expiresAt: string;
  };
}

export interface LocalInvitationStartResponse {
  invitation: LocalInvitationView;
  user: LocalUserView;
  nextStep: 'define_initial_password';
}

export interface LocalSessionView {
  id: string;
  userId: string;
  status: LocalSessionStatus;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface CreateLocalSessionResponse {
  session: LocalSessionView;
  sessionToken: string;
}

export interface LocalSessionValidationResponse {
  valid: boolean;
  session?: LocalSessionView;
  reason?: 'missing' | 'expired' | 'revoked';
}

export interface LocalAuthAuditContext {
  action:
    | 'local_user_created'
    | 'local_invitation_created'
    | 'local_invitation_started'
    | 'local_invitation_invalidated'
    | 'local_session_created'
    | 'local_session_revoked'
    | 'local_session_validation_failed';
  result: 'success' | 'denied';
  userId?: string;
  invitationId?: string;
  sessionId?: string;
  reason?: string;
  occurredAt: string;
}

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
