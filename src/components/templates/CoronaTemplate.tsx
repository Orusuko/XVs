import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/** Signature: the name sits inside a die-cut arch, a small tiara on the crown. */
export function CoronaTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1 text-center">
          <div className="arco-corona relative mx-auto max-w-md px-8 pb-8 pt-14">
            <Tiara className="absolute left-1/2 top-3 h-8 w-12 -translate-x-1/2" />
            <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
              Mis XV años
            </p>
            <h1 className="mt-4 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
              {evento.quinceanera}
            </h1>
          </div>
          <PadresPadrinos padres={padres} padrinos={evento.padrinos} />
        </header>
        <CuerpoInvitacion token={token} invitacion={invitacion} sinConfirmacion={sinConfirmacion} />
      </article>
    </main>
  );
}

function Tiara({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 26 12 10l12 12 12-12 8 16H4Z"
        stroke="var(--color-oro)"
        strokeWidth="1.4"
        fill="var(--color-oro)"
        fillOpacity="0.25"
      />
      <circle cx="12" cy="10" r="2" fill="var(--color-vino)" />
      <circle cx="24" cy="8" r="2.4" fill="var(--color-oro)" />
      <circle cx="36" cy="10" r="2" fill="var(--color-vino)" />
    </svg>
  );
}
