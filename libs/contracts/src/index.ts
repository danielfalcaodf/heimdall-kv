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

export interface AcceptLocalInvitationResponse extends CreateLocalSessionResponse {
  user: LocalUserView;
  nextStep: 'authenticated';
}

export interface LocalLoginResponse extends CreateLocalSessionResponse {
  user: LocalUserView;
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
    | 'local_invitation_accepted'
    | 'local_invitation_accept_failed'
    | 'local_invitation_invalidated'
    | 'local_login_succeeded'
    | 'local_login_failed'
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

// --- Audit domain ---

export type AuditResult = 'success' | 'denied' | 'error';

export type AuditScopeType = 'client' | 'sector' | 'project' | 'global';

export interface AuditEventView {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  scopeType?: AuditScopeType;
  scopeId?: string;
  result: AuditResult;
  ipAddress?: string;
  createdAt: string;
}

export interface CreateAuditEventInput {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  scopeType?: AuditScopeType;
  scopeId?: string;
  result: AuditResult;
  ipAddress?: string;
}

// --- Org domain ---

export type OrgEntityStatus = 'active' | 'archived' | 'deleted';

export interface OrgClientView {
  id: string;
  name: string;
  status: OrgEntityStatus;
  createdAt: string;
  archivedAt?: string;
}

export interface OrgSectorView {
  id: string;
  clientId: string;
  name: string;
  status: OrgEntityStatus;
  createdAt: string;
  archivedAt?: string;
}

export interface OrgProjectView {
  id: string;
  clientId: string;
  sectorId?: string;
  name: string;
  status: OrgEntityStatus;
  createdAt: string;
  archivedAt?: string;
}

export interface CreateOrgClientInput {
  name: string;
}

export interface CreateOrgSectorInput {
  clientId: string;
  name: string;
}

export interface CreateOrgProjectInput {
  clientId: string;
  sectorId?: string;
  name: string;
}

export interface OrgAuditContext {
  action:
    | 'org_client_created'
    | 'org_client_archived'
    | 'org_sector_created'
    | 'org_sector_archived'
    | 'org_project_created'
    | 'org_project_archived'
    | 'org_user_profile_created'
    | 'org_user_profile_suspended'
    | 'org_user_profile_reactivated'
    | 'org_user_binding_created'
    | 'org_user_binding_revoked';
  result: 'success' | 'denied';
  resourceId: string;
  actorUserId?: string;
  occurredAt: string;
}

export type OrgUserProfileStatus = 'active' | 'suspended' | 'removed';

export type OrgUserRole = 'viewer' | 'editor' | 'admin';

export interface OrgUserProfileView {
  id: string;
  userId: string;
  role: OrgUserRole;
  status: OrgUserProfileStatus;
  createdAt: string;
  suspendedAt?: string;
}

export interface OrgUserBindingView {
  id: string;
  userId: string;
  projectId?: string;
  sectorId?: string;
  clientId?: string;
  role: OrgUserRole;
  hasVaultAccess: boolean;
  createdAt: string;
  revokedAt?: string;
}

export interface CreateOrgUserProfileInput {
  userId: string;
  role: OrgUserRole;
}

export interface CreateOrgUserBindingInput {
  userId: string;
  role: OrgUserRole;
  projectId?: string;
  sectorId?: string;
  clientId?: string;
  hasVaultAccess?: boolean;
}

// --- ActiveScope / Bootstrap ---

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
