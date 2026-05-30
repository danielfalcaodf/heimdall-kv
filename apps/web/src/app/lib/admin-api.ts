import type { OrgUserBindingView, AuditEventView } from '@heimdall/contracts';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBaseUrl}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPermissions(): Promise<OrgUserBindingView[]> {
  return (await fetchJson<OrgUserBindingView[]>('/org/bindings')) ?? [];
}

export async function getAuditEvents(): Promise<AuditEventView[]> {
  return (await fetchJson<AuditEventView[]>('/audit/events')) ?? [];
}
