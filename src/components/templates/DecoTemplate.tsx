import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

/**
 * Signature: a symmetric geometric fan above a nested ink-and-gold frame —
 * Poiret/Didact mood, distinct from Mariposas' hairline keepsake card.
 */
export function DecoTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1">
          <AbanicoDeco className="mx-auto h-16 w-48" />
          <div className="marco-deco mt-4 bg-papel-alto px-6 py-10 text-center">
            <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
              Mis XV años
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-tinta sm:text-6xl">
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
          </div>
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

function AbanicoDeco({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" fill="none" aria-hidden="true" className={className}>
      <path d="M100 60 L12 8" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M100 60 L40 4" stroke="var(--color-tinta)" strokeWidth="0.75" opacity="0.7" />
      <path d="M100 60 L70 2" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M100 60 L100 0" stroke="var(--color-vino)" strokeWidth="1.25" />
      <path d="M100 60 L130 2" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M100 60 L160 4" stroke="var(--color-tinta)" strokeWidth="0.75" opacity="0.7" />
      <path d="M100 60 L188 8" stroke="var(--color-oro)" strokeWidth="1" />
      <path d="M20 56 H180" stroke="var(--color-oro)" strokeWidth="1.5" />
      <path d="M36 50 H164" stroke="var(--color-tinta)" strokeWidth="0.75" />
    </svg>
  );
}
