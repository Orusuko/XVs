import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/** Signature: a translucent layer over the hero and a wax-seal monogram. */
export function VitelaTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <header className="surgir surgir-1">
          <div className="capa-vitela relative px-6 py-12 text-center">
            <p className="font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
              Mis XV años
            </p>
            <h1 className="mt-4 font-script text-6xl leading-[1.05] text-vino sm:text-7xl">
              {evento.quinceanera}
            </h1>
            <PadresPadrinos padres={padres} padrinos={evento.padrinos} />
            <SelloLacre className="absolute -bottom-5 left-1/2 h-12 w-12 -translate-x-1/2" />
          </div>
        </header>
        <div className="mt-10">
          <CuerpoInvitacion token={token} invitacion={invitacion} sinConfirmacion={sinConfirmacion} />
        </div>
      </article>
    </main>
  );
}

function SelloLacre({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="28" fill="var(--color-vino)" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="var(--color-oro)" strokeWidth="1" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="var(--color-papel-alto)"
        fontSize="14"
        fontFamily="Georgia, serif"
      >
        XV
      </text>
    </svg>
  );
}
