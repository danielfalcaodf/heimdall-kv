import type {
  OrgClientView,
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

export async function getOrgClients(): Promise<OrgClientView[]> {
  return (await fetchJson<OrgClientView[]>('/org/clientes')) ?? [];
}

export async function getOrgSectors(): Promise<OrgSectorView[]> {
  return (await fetchJson<OrgSectorView[]>('/org/setores')) ?? [];
}

export async function getOrgProjects(): Promise<OrgProjectView[]> {
  return (await fetchJson<OrgProjectView[]>('/org/projetos')) ?? [];
}

export async function getOrgUsers(): Promise<OrgUserProfileView[]> {
  return (await fetchJson<OrgUserProfileView[]>('/org/usuarios')) ?? [];
}
