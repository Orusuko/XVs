import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DETALLE_INVITACION_NO_PUBLICADA,
  TITULO_INVITACION_NO_PUBLICADA,
} from '@/lib/invitacion-publica';
import { cargarInvitacion } from '@/lib/invitation';
import { layoutDe } from '@/lib/templates/catalogo';
import { POR_LAYOUT } from '@/lib/templates/por-layout';
import { EstadoHoja } from '@/components/ui/EstadoHoja';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitacion = await cargarInvitacion(token);

  if (invitacion.tipo === 'indisponible') {
    return { title: 'Invitación temporalmente no disponible' };
  }

  if (invitacion.tipo === 'no_publicado') {
    return { title: TITULO_INVITACION_NO_PUBLICADA };
  }

  if (invitacion.tipo !== 'ok') return { title: 'Invitación no encontrada' };

  return {
    title: `XV años de ${invitacion.vista.evento.quinceanera}`,
    description: `Invitación para la familia ${invitacion.vista.familia.nombre}.`,
    robots: { index: false, follow: false },
  };
}

export default async function InvitacionPage({ params }: Props) {
  const { token } = await params;
  const resultado = await cargarInvitacion(token);

  if (resultado.tipo === 'indisponible') {
    return (
      <main className="textura-papel flex min-h-screen items-center justify-center">
        <EstadoHoja
          etiqueta="Invitación"
          titulo="Temporalmente no disponible"
          detalle="Estamos actualizando el sistema de boletos. Vuelve a intentar en unos minutos o avisa a quien te invitó."
        />
      </main>
    );
  }

  if (resultado.tipo === 'no_publicado') {
    return (
      <main className="textura-papel flex min-h-screen items-center justify-center">
        <EstadoHoja
          etiqueta="Invitación"
          titulo={TITULO_INVITACION_NO_PUBLICADA}
          detalle={DETALLE_INVITACION_NO_PUBLICADA}
        />
      </main>
    );
  }

  if (resultado.tipo !== 'ok') notFound();

  const Plantilla = POR_LAYOUT[layoutDe(resultado.vista.evento.templateId)];
  return <Plantilla token={token} invitacion={resultado.vista} />;
}