import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadInvitation } from '@/lib/invitation';
import { ClasicaTemplate } from '@/components/templates/ClasicaTemplate';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitacion = await loadInvitation(token);

  if (!invitacion) return { title: 'Invitación no encontrada' };

  return {
    title: `XV años de ${invitacion.evento.quinceanera}`,
    description: `Invitación para la familia ${invitacion.familia.nombre}.`,
    robots: { index: false, follow: false },
  };
}

export default async function InvitacionPage({ params }: Props) {
  const { token } = await params;
  const invitacion = await loadInvitation(token);

  if (!invitacion) notFound();

  return <ClasicaTemplate token={token} invitacion={invitacion} />;
}
