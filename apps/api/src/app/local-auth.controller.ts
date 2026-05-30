import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import type {
  CreateLocalInvitationResponse,
  LocalInvitationStartResponse,
  LocalInvitationView,
  LocalSessionValidationResponse,
  LocalSessionView,
  UserRole,
} from '@heimdall/contracts';
import { LocalAuthError, LocalAuthService } from './local-auth.service';

interface CreateInvitationBody {
  email?: string;
  displayName?: string;
  role?: UserRole;
  ttlMinutes?: number;
}

interface ValidateSessionBody {
  sessionToken?: string;
}

function toHttpError(error: unknown): never {
  if (error instanceof LocalAuthError) {
    if (['INVITATION_NOT_FOUND', 'USER_NOT_FOUND', 'SESSION_NOT_FOUND'].includes(error.code)) {
      throw new NotFoundException('Recurso nao encontrado.');
    }

    throw new BadRequestException('Solicitacao invalida.');
  }

  throw error;
}

@Controller('auth/local')
export class LocalAuthController {
  constructor(private readonly localAuth: LocalAuthService) {}

  @Post('invitations')
  createInvitation(@Body() body: CreateInvitationBody): CreateLocalInvitationResponse {
    try {
      const created = this.localAuth.createInvitation({
        email: body.email ?? '',
        displayName: body.displayName,
        role: body.role,
        ttlMinutes: body.ttlMinutes,
      });

      return {
        invitation: created.invitation,
        delivery: created.delivery,
      };
    } catch (error) {
      return toHttpError(error);
    }
  }

  @Get('invitations/start/:token')
  startInvitation(@Param('token') token: string): LocalInvitationStartResponse {
    try {
      const started = this.localAuth.startInvitationByToken(token);

      return {
        invitation: started.invitation,
        user: started.user,
        nextStep: started.nextStep,
      };
    } catch (error) {
      return toHttpError(error);
    }
  }

  @Post('invitations/:id/invalidate')
  invalidateInvitation(@Param('id') id: string): LocalInvitationView {
    try {
      return this.localAuth.invalidateInvitation(id);
    } catch (error) {
      return toHttpError(error);
    }
  }

  @Post('sessions/validate')
  validateSession(@Body() body: ValidateSessionBody): LocalSessionValidationResponse {
    return this.localAuth.validateSessionByToken(body.sessionToken ?? '');
  }

  @Delete('sessions')
  endSession(@Body() body: ValidateSessionBody): LocalSessionView {
    try {
      return this.localAuth.endSessionByToken(body.sessionToken ?? '');
    } catch (error) {
      return toHttpError(error);
    }
  }
}
