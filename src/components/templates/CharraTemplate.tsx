import { CuerpoInvitacion } from '@/components/invitation/CuerpoInvitacion';
import { PadresPadrinos } from '@/components/invitation/PadresPadrinos';
import { claseTema } from '@/lib/templates/catalogo';
import type { InvitationView } from '@/lib/types';

type Props = {
  token: string;
  invitacion: InvitationView;
  sinConfirmacion?: boolean;
};

/** Signature: zarape stripes and a line horseshoe — ranchero, not a cartoon horse. */
export function CharraTemplate({ token, invitacion, sinConfirmacion }: Props) {
  const { evento } = invitacion;
  const padres = [evento.padre, evento.madre].filter(Boolean) as string[];
  const tema = claseTema(evento.templateId);

  return (
    <main className={`${tema} min-h-screen px-5 py-12`}>
      <article className="mx-auto w-full max-w-xl">
        <FranjaZarape />
        <header className="surgir surgir-1 py-10 text-center">
          <Herradura className="mx-auto h-16 w-16" />
          <p className="mt-4 font-ticket text-[11px] uppercase tracking-[0.34em] text-oro">
            Mis XV años
          </p>
          <h1 className="mt-4 font-display text-5xl leading-tight text-tinta sm:text-6xl">
            {evento.quinceanera}
          </h1>
          <PadresPadrinos padres={padres} padrinos={evento.padrinos} />
        </header>
        <FranjaZarape />
        <CuerpoInvitacion token={token} invitacion={invitacion} sinConfirmacion={sinConfirmacion} />
      </article>
    </main>
  );
}

function FranjaZarape() {
  return <div className="franja-zarape h-3 w-full" aria-hidden="true" />;
}

function Herradura({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path
        d="M16 12c-8 8-8 32 0 40 4 4 10 6 16 2M48 12c8 8 8 32 0 40-4 4-10 6-16 2"
        stroke="var(--color-vino)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M20 18h6M38 18h6M18 28h6M40 28h6M20 38h5M39 38h5" stroke="var(--color-oro)" strokeWidth="1.5" />
    </svg>
  );
}
