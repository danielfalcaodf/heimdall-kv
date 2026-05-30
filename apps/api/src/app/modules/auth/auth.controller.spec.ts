import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LocalAuthService } from './local-auth.service';
import { AuditService } from '../audit/audit.service';

const VALID_PASSWORD = 'ValidPass1!abcd';

function makeService(): LocalAuthService {
  return new LocalAuthService();
}

function makeAudit(): jest.Mocked<Pick<AuditService, 'record'>> {
  return { record: jest.fn() };
}

function makeController(authSvc?: LocalAuthService): [AuthController, ReturnType<typeof makeAudit>] {
  const audit = makeAudit();
  return [new AuthController(authSvc ?? makeService(), audit as unknown as AuditService), audit];
}

describe('AuthController', () => {
  it('retorna 400 para e-mail inválido no convite', () => {
    const [ctrl] = makeController();
    expect(() => ctrl.createInvite({ email: 'not-email' })).toThrow(BadRequestException);
  });

  it('cria convite e registra audit', () => {
    const [ctrl, audit] = makeController();
    const res = ctrl.createInvite({ email: 'user@example.com', role: 'viewer' });
    expect(res.invitation).toBeDefined();
    expect(res.delivery).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create_invitation', result: 'success' }),
    );
  });

  it('valida token de convite existente', () => {
    const svc = makeService();
    const inv = svc.createInvitation({ email: 'a@example.com' }, new Date());
    const [ctrl] = makeController(svc);
    const res = ctrl.validateInvite(inv.inviteToken);
    expect(res.invitation.id).toBe(inv.invitation.id);
    expect(res.nextStep).toBe('define_initial_password');
  });

  it('retorna 404 para token de convite inexistente', () => {
    const [ctrl] = makeController();
    expect(() => ctrl.validateInvite('invalid-token')).toThrow(BadRequestException);
  });

  it('aceita convite e cria sessão', () => {
    const svc = makeService();
    const inv = svc.createInvitation({ email: 'b@example.com' }, new Date());
    svc.startInvitationByToken(inv.inviteToken, new Date());
    const [ctrl, audit] = makeController(svc);
    const res = ctrl.acceptInvite(inv.inviteToken, { password: VALID_PASSWORD });
    expect(res.session).toBeDefined();
    expect(res.sessionToken).toBeDefined();
    expect(res.nextStep).toBe('authenticated');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'accept_invitation', result: 'success' }),
    );
  });

  it('login com credenciais inválidas retorna 401 e registra negação', () => {
    const [ctrl, audit] = makeController();
    expect(() => ctrl.login({ email: 'x@x.com', password: 'wrong' })).toThrow(UnauthorizedException);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login', result: 'denied' }),
    );
  });

  it('login bem-sucedido registra evento de audit', () => {
    const svc = makeService();
    const inv = svc.createInvitation({ email: 'c@example.com' }, new Date());
    svc.startInvitationByToken(inv.inviteToken, new Date());
    svc.acceptInvitation({ inviteToken: inv.inviteToken, password: VALID_PASSWORD }, new Date());

    const [ctrl, audit] = makeController(svc);
    const res = ctrl.login({ email: 'c@example.com', password: VALID_PASSWORD });
    expect(res.session).toBeDefined();
    expect(res.sessionToken).toBeDefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login', result: 'success' }),
    );
  });
});
