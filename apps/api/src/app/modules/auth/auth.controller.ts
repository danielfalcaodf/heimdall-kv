import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CreateLocalInvitationResponse,
  LocalInvitationStartResponse,
  AcceptLocalInvitationResponse,
  LocalLoginResponse,
  LocalSessionValidationResponse,
} from '@heimdall/contracts';
import { LocalAuthService, LocalAuthError } from './local-auth.service';
import { AuditService } from '../audit/audit.service';

function mapAuthError(e: LocalAuthError): never {
  const { code } = e;
  if (code === 'INVALID_EMAIL' || code === 'INVALID_ROLE' || code === 'PASSWORD_POLICY_FAILED') {
    throw new BadRequestException('Dados inválidos.');
  }
  if (code === 'USER_NOT_INVITABLE') {
    throw new BadRequestException('Usuário não pode ser convidado.');
  }
  if (code === 'INVITATION_NOT_FOUND' || code === 'USER_NOT_FOUND' || code === 'SESSION_NOT_FOUND') {
    throw new NotFoundException('Recurso não encontrado.');
  }
  if (code === 'INVITATION_NOT_USABLE') {
    throw new BadRequestException('Convite inválido ou expirado.');
  }
  if (code === 'SESSION_NOT_ALLOWED' || code === 'LOGIN_DENIED') {
    throw new UnauthorizedException('Acesso negado.');
  }
  throw new ForbiddenException('Operação não permitida.');
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: LocalAuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('invite')
  createInvite(
    @Body() body: { email: string; role?: string; displayName?: string },
  ): CreateLocalInvitationResponse {
    try {
      const result = this.authService.createInvitation(
        { email: body.email, role: body.role as never, displayName: body.displayName },
        new Date(),
      );
      this.auditService.record({
        actorUserId: 'system',
        action: 'create_invitation',
        resourceType: 'invitation',
        resourceId: result.invitation.id,
        result: 'success',
      });
      return { invitation: result.invitation, delivery: result.delivery };
    } catch (e) {
      if (e instanceof LocalAuthError) {
        this.auditService.record({
          actorUserId: 'system',
          action: 'create_invitation',
          resourceType: 'invitation',
          result: 'error',
        });
        mapAuthError(e);
      }
      throw e;
    }
  }

  @Get('invite/:token')
  validateInvite(@Param('token') token: string): LocalInvitationStartResponse {
    try {
      const result = this.authService.startInvitationByToken(token, new Date());
      return { invitation: result.invitation, user: result.user, nextStep: result.nextStep };
    } catch (e) {
      if (e instanceof LocalAuthError) mapAuthError(e);
      throw e;
    }
  }

  @Post('invite/:token/accept')
  acceptInvite(
    @Param('token') token: string,
    @Body() body: { password: string },
  ): AcceptLocalInvitationResponse {
    try {
      const result = this.authService.acceptInvitation(
        { inviteToken: token, password: body.password },
        new Date(),
      );
      this.auditService.record({
        actorUserId: result.session.userId,
        action: 'accept_invitation',
        resourceType: 'user',
        resourceId: result.session.userId,
        result: 'success',
      });
      return { session: result.session, sessionToken: result.sessionToken, user: result.user, nextStep: result.nextStep };
    } catch (e) {
      if (e instanceof LocalAuthError) {
        this.auditService.record({
          actorUserId: 'anonymous',
          action: 'accept_invitation',
          resourceType: 'invitation',
          result: 'denied',
        });
        mapAuthError(e);
      }
      throw e;
    }
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }): LocalLoginResponse {
    try {
      const result = this.authService.loginLocal(
        { email: body.email, password: body.password },
        new Date(),
      );
      this.auditService.record({
        actorUserId: result.session.userId,
        action: 'login',
        resourceType: 'session',
        resourceId: result.session.id,
        result: 'success',
      });
      return { session: result.session, sessionToken: result.sessionToken, user: result.user };
    } catch (e) {
      if (e instanceof LocalAuthError) {
        this.auditService.record({
          actorUserId: 'anonymous',
          action: 'login',
          resourceType: 'session',
          result: 'denied',
        });
        mapAuthError(e);
      }
      throw e;
    }
  }

  @Get('session/:token')
  validateSession(@Param('token') token: string): LocalSessionValidationResponse {
    try {
      return this.authService.validateSessionByToken(token, new Date());
    } catch (e) {
      if (e instanceof LocalAuthError) mapAuthError(e);
      throw e;
    }
  }
}
