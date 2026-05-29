import { AppShell } from '../components';
import { getBootstrap } from '../lib/api';

export default async function AppPage() {
  const bootstrap = await getBootstrap();

  return <AppShell bootstrap={bootstrap} />;
}
