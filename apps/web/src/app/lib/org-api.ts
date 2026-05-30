import type {
  CreateOrgClientInput,
  CreateOrgProjectInput,
  CreateOrgSectorInput,
  CreateOrgUserBindingInput,
  CreateOrgUserProfileInput,
  OrgClientView,
  OrgUserBindingView,
  OrgSectorView,
  OrgProjectView,
  OrgUserProfileView,
} from '@heimdall/contracts';

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

async function sendJson<T>(path: string, method: 'POST' | 'PATCH', body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getOrgClients(): Promise<OrgClientView[]> {
  return (await fetchJson<OrgClientView[]>('/org/clients')) ?? [];
}

export async function getOrgSectors(): Promise<OrgSectorView[]> {
  return (await fetchJson<OrgSectorView[]>('/org/sectors')) ?? [];
}

export async function getOrgProjects(): Promise<OrgProjectView[]> {
  return (await fetchJson<OrgProjectView[]>('/org/projects')) ?? [];
}

export async function getOrgUsers(): Promise<OrgUserProfileView[]> {
  return (await fetchJson<OrgUserProfileView[]>('/org/profiles')) ?? [];
}

export async function getOrgBindings(): Promise<OrgUserBindingView[]> {
  return (await fetchJson<OrgUserBindingView[]>('/org/bindings')) ?? [];
}

export async function createOrgClient(input: CreateOrgClientInput): Promise<OrgClientView | null> {
  return sendJson<OrgClientView>('/org/clients', 'POST', input);
}

export async function createOrgSector(input: CreateOrgSectorInput): Promise<OrgSectorView | null> {
  return sendJson<OrgSectorView>('/org/sectors', 'POST', input);
}

export async function createOrgProject(input: CreateOrgProjectInput): Promise<OrgProjectView | null> {
  return sendJson<OrgProjectView>('/org/projects', 'POST', input);
}

export async function createOrgUserProfile(input: CreateOrgUserProfileInput): Promise<OrgUserProfileView | null> {
  return sendJson<OrgUserProfileView>('/org/profiles', 'POST', input);
}

export async function suspendOrgUserProfile(id: string): Promise<OrgUserProfileView | null> {
  return sendJson<OrgUserProfileView>(`/org/profiles/${encodeURIComponent(id)}/suspend`, 'PATCH');
}

export async function reactivateOrgUserProfile(id: string): Promise<OrgUserProfileView | null> {
  return sendJson<OrgUserProfileView>(`/org/profiles/${encodeURIComponent(id)}/reactivate`, 'PATCH');
}

export async function createOrgBinding(input: CreateOrgUserBindingInput): Promise<OrgUserBindingView | null> {
  return sendJson<OrgUserBindingView>('/org/bindings', 'POST', input);
}

export async function revokeOrgBinding(id: string): Promise<OrgUserBindingView | null> {
  return sendJson<OrgUserBindingView>(`/org/bindings/${encodeURIComponent(id)}/revoke`, 'PATCH');
}
