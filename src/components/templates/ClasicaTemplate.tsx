import { BloqueLugar } from '@/components/invitation/BloqueLugar';
import { PanelConfirmacion } from '@/components/invitation/PanelConfirmacion';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
};

export function ClasicaTemplate({ token, invitacion }: Props) {
  const { evento, familia } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} textura-papel min-h-screen px-5 py-12`.trim()}>
      <article className="mx-auto w-full max-w-xl">
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

        {/* The family's own name, set like an engraved plate. */}
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
