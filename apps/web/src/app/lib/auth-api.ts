const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export interface InviteResult {
  ok: boolean;
  error?: string;
}

export interface InviteValidation {
  valid: boolean;
  email?: string;
  error?: string;
}

export async function loginLocal(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      return { ok: false, error: 'Credenciais inválidas ou acesso não autorizado.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Serviço temporariamente indisponível. Tente novamente.' };
  }
}

export async function validateInviteToken(token: string): Promise<InviteValidation> {
  try {
    const res = await fetch(`${apiBaseUrl}/auth/convite/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { valid: false, error: 'Convite inválido, expirado ou já utilizado.' };
    }
    const data = await res.json();
    return { valid: true, email: data.email };
  } catch {
    return { valid: false, error: 'Não foi possível validar o convite.' };
  }
}

export async function acceptInvite(token: string, password: string): Promise<InviteResult> {
  try {
    const res = await fetch(`${apiBaseUrl}/auth/convite/${encodeURIComponent(token)}/aceitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include',
    });
    if (!res.ok) {
      return { ok: false, error: 'Não foi possível ativar a conta. Verifique o convite.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Serviço temporariamente indisponível. Tente novamente.' };
  }
}
