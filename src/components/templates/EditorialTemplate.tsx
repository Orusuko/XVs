import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { formatearHora, partesFecha } from '@/lib/format';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/**
 * Signature: the reception date is the headline. No floral SVG.
 * Name stays in a smaller serif under the number.
 */
export function EditorialTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);
  const hero = evento.recepcion ?? evento.misa;
  const partes = partesFecha(hero?.fecha_hora);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1">
          {partes ? (
            <p className="font-ticket text-7xl leading-none tracking-tight text-vino sm:text-8xl">
              {partes.dia}
            </p>
          ) : (
            <p className="font-ticket text-7xl leading-none text-vino">XV</p>
          )}
          <div className="mt-2 flex items-baseline justify-between gap-4 border-b border-tinta pb-3">
            <p className="font-ticket text-sm uppercase tracking-[0.2em] text-oro">
              {partes ? `${partes.mes} ${partes.anio}` : 'Mis XV años'}
            </p>
            {hero?.fecha_hora && (
              <p className="font-ticket text-sm text-tinta-suave">{formatearHora(hero.fecha_hora)}</p>
            )}
          </div>
          <h1 className="mt-8 font-display text-4xl leading-tight text-tinta">{evento.quinceanera}</h1>
          <PadresPadrinos padres={padres} padrinos={evento.padrinos} className="text-left" />
        </header>
        <CuerpoInvitacion
          token={token}
          invitacion={invitacion}
          placa="ninguna"
          sinConfirmacion={sinConfirmacion}
        />
      </article>
    </main>
  );
}
