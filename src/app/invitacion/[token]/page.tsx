import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadInvitation } from '@/lib/invitation';
import { BohoTemplate } from '@/components/templates/BohoTemplate';
import { ClasicaTemplate } from '@/components/templates/ClasicaTemplate';
import { DecoTemplate } from '@/components/templates/DecoTemplate';
import { JardinTemplate } from '@/components/templates/JardinTemplate';
import { MariposasTemplate } from '@/components/templates/MariposasTemplate';
import { ValsTemplate } from '@/components/templates/ValsTemplate';
import { layoutDe, type LayoutId } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

type PlantillaProps = { token: string; invitacion: InvitationView };

const POR_LAYOUT: Record<LayoutId, (props: PlantillaProps) => React.JSX.Element> = {
  clasica: ClasicaTemplate,
  jardin: JardinTemplate,
  mariposas: MariposasTemplate,
  vals: ValsTemplate,
  deco: DecoTemplate,
  boho: BohoTemplate,
};

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
