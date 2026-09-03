import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

/**
 * Signature: the hero sits inside a nested gold hairline frame with
 * butterflies breaking out of its corners — a keepsake-card composition,
 * distinct from Clásica's open page and Jardín's numeral lockup.
 */
export function MariposasTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const foto = invitacion.evento.templateConfig.foto_url;

  return (
    <main className="tema-mariposas min-h-screen px-5 py-12">
      <article className="mx-auto w-full max-w-xl">
        <div className="surgir surgir-1 relative">
          <div className="marco-mariposas relative bg-papel-alto px-6 py-10 text-center">
            {foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto}
                alt=""
                className="mx-auto mb-5 h-28 w-28 rounded-full border-2 border-oro object-cover"
              />
            )}

            <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
              Mis XV años
            </p>

            <h1 className="mt-4 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
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

          <Mariposa className="absolute -right-4 -top-5 h-14 w-14 -rotate-12" />
          <Mariposa className="absolute -bottom-5 -left-4 h-12 w-12 rotate-[160deg]" />
        </div>

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

function Mariposa({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path
        d="M32 30c-4-14-16-20-22-16-6 4-4 18 8 20 6 1 11-1 14-4Z"
        fill="var(--color-vino)"
        opacity="0.55"
      />
      <path
        d="M32 30c4-14 16-20 22-16 6 4 4 18-8 20-6 1-11-1-14-4Z"
        fill="var(--color-oro)"
        opacity="0.55"
      />
      <path
        d="M32 32c-3 10-12 16-17 13-5-3-2-14 7-16 4-1 8 0 10 3Z"
        fill="var(--color-vino)"
        opacity="0.4"
      />
      <path
        d="M32 32c3 10 12 16 17 13 5-3 2-14-7-16-4-1-8 0-10 3Z"
        fill="var(--color-oro)"
        opacity="0.4"
      />
      <rect x="30.5" y="20" width="3" height="24" rx="1.5" fill="var(--color-tinta)" opacity="0.7" />
    </svg>
  );
}
