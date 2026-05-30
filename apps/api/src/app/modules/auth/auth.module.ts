import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { UserRepository } from './repositories/user.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { SessionRepository } from './repositories/session.repository';
import { LocalAuthService } from './local-auth.service';
import { AuthController } from './auth.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [
    PasswordService,
    TokenService,
    UserRepository,
    InvitationRepository,
    SessionRepository,
    LocalAuthService,
  ],
  exports: [LocalAuthService],
})
export class AuthModule {}
