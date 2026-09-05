import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

/**
 * Signature: a centered medallion with the XV monogram and a ribbon divider —
 * ballroom invitation, distinct from Clásica's open plate and Jardín's lockup.
 */
export function ValsTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
            <MedallonVals className="absolute inset-0 h-full w-full" />
            <p className="relative font-script text-5xl leading-none text-vino">XV</p>
          </div>
          <CintaVals className="mx-auto mt-2 h-6 w-56" />
          <h1 className="mt-5 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
            {evento.quinceanera}
          </h1>
          {padres.length > 0 && (
            <p className="mt-6 text-sm text-tinta-suave">
              Con la bendición de {padres.join(' y ')}
            </p>
          )}
          {evento.padrinos.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-tinta-suave">
              {evento.padrinos.map((padrino) => (
                <li key={`${padrino.rol}-${padrino.nombre}`}>
                  <span className="text-tinta">{padrino.nombre}</span>
                  {padrino.rol && <span className="text-tinta-suave"> · {padrino.rol}</span>}
                </li>
              ))}
            </ul>
          )}
        </header>

        <section className="surgir surgir-2 mt-10 border-y border-borde py-6 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-tinta-suave">
            Esta invitación es para
          </p>
          <p className="mt-3 font-display text-3xl text-tinta">Familia {familia.nombre}</p>
          <p className="mt-2 font-ticket text-sm text-oro">
            {familia.boletos} {familia.boletos === 1 ? 'boleto' : 'boletos'}
          </p>
        </section>

        {evento.mensaje && (
          <p className="surgir surgir-3 mt-10 text-center font-display text-lg leading-relaxed text-tinta-suave">
            {evento.mensaje}
          </p>
        )}

        <div className="surgir surgir-4 mt-12 space-y-10">
          {evento.misa && (
            <BloqueLugar etiqueta="Misa" lugar={evento.misa} quinceanera={evento.quinceanera} />
          )}
          {evento.recepcion && (
            <BloqueLugar
              etiqueta="Recepción"
              lugar={evento.recepcion}
              quinceanera={evento.quinceanera}
            />
          )}
        </div>

        <div className="surgir surgir-5 mt-12 border-t border-borde pt-8">
          <PanelConfirmacion token={token} invitacion={invitacion} />
        </div>
      </article>
    </main>
  );
}

function MedallonVals({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className={className}>
      <circle cx="60" cy="60" r="56" stroke="var(--color-oro)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="48" stroke="var(--color-vino)" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="40" stroke="var(--color-oro)" strokeWidth="0.5" opacity="0.7" />
    </svg>
  );
}

function CintaVals({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 28" fill="none" aria-hidden="true" className={className}>
      <path d="M8 14h204" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M78 14 90 6h40l12 8-12 8H90l-12-8Z" fill="var(--color-vino)" opacity="0.35" />
    </svg>
  );
}
