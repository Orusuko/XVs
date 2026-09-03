import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

/**
 * Signature: a numeral lockup ("XV" as a giant script glyph, "años" beneath
 * it) instead of putting the quinceañera's name in script — the name itself
 * stays in the display serif. Two-role type pairing, watercolor palette.
 */
export function JardinTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];

  return (
    <main className="tema-jardin relative min-h-screen overflow-hidden px-5 py-12">
      <RamoEsquina className="absolute -left-6 -top-6 h-40 w-40 opacity-90" />
      <RamoEsquina className="absolute -bottom-6 -right-6 h-40 w-40 rotate-180 opacity-90" />

      <article className="relative mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">Mis</p>
          <p className="-mt-2 font-script text-8xl leading-none text-vino">XV</p>
          <p className="-mt-3 font-script text-4xl leading-none text-vino">años</p>

          <h1 className="mt-5 font-display text-4xl leading-tight text-tinta">
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

function RamoEsquina({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <path d="M8 8c18 2 30 14 32 32-18-2-30-14-32-32Z" fill="var(--color-borde)" opacity="0.7" />
      <path d="M14 20c14 0 24 10 24 24-14 0-24-10-24-24Z" fill="var(--color-oro-claro)" opacity="0.6" />
      <circle cx="16" cy="16" r="4" fill="var(--color-vino)" opacity="0.5" />
      <circle cx="30" cy="30" r="3" fill="var(--color-oro)" opacity="0.6" />
    </svg>
  );
}
