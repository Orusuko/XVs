import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadInvitation } from '@/lib/invitation';
import { layoutDe } from '@/lib/templates/catalogo';
import { POR_LAYOUT } from '@/lib/templates/por-layout';

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

  const Plantilla = POR_LAYOUT[layoutDe(invitacion.evento.templateId)];
  return <Plantilla token={token} invitacion={invitacion} />;
}
