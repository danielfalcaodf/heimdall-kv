import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { UserRepository } from './repositories/user.repository';
import { InvitationRepository } from './repositories/invitation.repository';
import { SessionRepository } from './repositories/session.repository';
import { LocalAuthService } from './local-auth.service';

@Module({
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
