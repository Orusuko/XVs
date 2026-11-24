import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/**
 * Signature: the day is a vertical column (Misa then Recepción).
 * Same wine/gold as Clásica — the structure is the difference.
 */
export function ItinerarioTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl break-words">
        <header className="surgir surgir-1 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
            El día de {evento.quinceanera}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-tinta sm:text-5xl">
            Itinerario
          </h1>
          <PadresPadrinos padres={padres} padrinos={evento.padrinos} />
        </header>
        <CuerpoInvitacion
          token={token}
          invitacion={invitacion}
          lugares="columna"
          placa="programa"
          sinConfirmacion={sinConfirmacion}
        />
      </article>
    </main>
  );
}
