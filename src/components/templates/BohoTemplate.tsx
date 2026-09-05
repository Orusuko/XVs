import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

/**
 * Signature: an organic branch that sits off-axis — not a centered lockup
 * and not a geometric frame. Palette does the rest.
 */
export function BohoTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} relative min-h-screen overflow-hidden px-5 py-12`}>
      <RamaBoho className="absolute -left-4 top-8 h-64 w-24 opacity-90" />
      <RamaBoho className="absolute -right-6 bottom-16 h-48 w-20 rotate-[200deg] opacity-70" />

      <article className="relative mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
            Mis XV años
          </p>
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

function RamaBoho({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 200" fill="none" aria-hidden="true" className={className}>
      <path
        d="M28 8c8 28-6 48 4 78s-10 52 2 92"
        stroke="var(--color-vino)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M32 36c18-4 28 8 22 18"
        stroke="var(--color-oro)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M50 48c6-10 4-18-2-22" fill="var(--color-oro)" opacity="0.45" />
      <path
        d="M30 88c-16 2-24 16-16 26"
        stroke="var(--color-vino)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <ellipse cx="18" cy="108" rx="7" ry="11" fill="var(--color-borde)" opacity="0.8" />
      <ellipse cx="52" cy="130" rx="6" ry="10" fill="var(--color-oro)" opacity="0.4" />
      <path
        d="M34 150c14 6 20 18 12 28"
        stroke="var(--color-oro)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
