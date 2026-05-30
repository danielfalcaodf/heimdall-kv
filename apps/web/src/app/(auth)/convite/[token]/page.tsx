import ConvitePage from './invite-form';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  return <ConvitePage token={token} />;
}
