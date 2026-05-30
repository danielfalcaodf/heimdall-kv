import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { UserRepository } from './repositories/user.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { SessionRepository } from './repositories/session.repository';
import { LocalAuthService } from './local-auth.service';
import { AuthController } from './auth.controller';
import { AuditModule } from '../audit/audit.module';
import { OrgModule } from '../org/org.module';
import { ProjectRoleGuard } from './guards/project-role.guard';
import { VaultPermissionGuard } from './guards/vault-permission.guard';

@Module({
  imports: [AuditModule, OrgModule],
  controllers: [AuthController],
  providers: [
    PasswordService,
    TokenService,
    UserRepository,
    InvitationRepository,
    SessionRepository,
    LocalAuthService,
    ProjectRoleGuard,
    VaultPermissionGuard,
  ],
  exports: [LocalAuthService, ProjectRoleGuard, VaultPermissionGuard],
})
export class AuthModule {}
