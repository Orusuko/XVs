import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { CLAVE_FOTO_CONFIG, claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/** Signature: a wide portrait first, type underneath — not a centered script lockup. */
export function RetratoTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);
  const foto = evento.templateConfig[CLAVE_FOTO_CONFIG];

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1">
          <div className="marco-retrato overflow-hidden bg-papel-alto">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="" className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/5] w-full items-end px-6 pb-8">
                <p className="font-display text-4xl leading-tight text-tinta">{evento.quinceanera}</p>
              </div>
            )}
          </div>
          <div className="mt-6 text-left">
            <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
              Mis XV años
            </p>
            {foto && (
              <h1 className="mt-3 font-display text-4xl leading-tight text-tinta">
                {evento.quinceanera}
              </h1>
            )}
            <PadresPadrinos padres={padres} padrinos={evento.padrinos} className="text-left" />
          </div>
        </header>
        <CuerpoInvitacion
          token={token}
          invitacion={invitacion}
          alineacion="izquierda"
          sinConfirmacion={sinConfirmacion}
        />
      </article>
    </main>
  );
}
