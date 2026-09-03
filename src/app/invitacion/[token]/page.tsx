import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadInvitation } from '@/lib/invitation';
import { ClasicaTemplate } from '@/components/templates/ClasicaTemplate';
import { JardinTemplate } from '@/components/templates/JardinTemplate';
import { MariposasTemplate } from '@/components/templates/MariposasTemplate';
import type { TemplateId } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

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

const PLANTILLAS: Record<TemplateId, (props: { token: string; invitacion: InvitationView }) => React.JSX.Element> = {
  clasica: ClasicaTemplate,
  jardin: JardinTemplate,
  mariposas: MariposasTemplate,
};

export default async function InvitacionPage({ params }: Props) {
  const { token } = await params;
  const invitacion = await loadInvitation(token);

  if (!invitacion) notFound();

  const Plantilla = PLANTILLAS[invitacion.evento.templateId];
  return <Plantilla token={token} invitacion={invitacion} />;
}
